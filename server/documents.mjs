import { PDFParse } from "pdf-parse";
import { unzipSync, strFromU8 } from "fflate";
import { SaxesParser } from "saxes";
import { HttpError } from "./providers.mjs";

export async function extractDocument(filename, base64) {
  if (typeof base64 !== "string" || base64.length > 2_100_000)
    throw new HttpError(413, "Use a file smaller than 1.5 MB");
  const buffer = Buffer.from(base64, "base64");
  if (!buffer.length || buffer.length > 1_500_000)
    throw new HttpError(413, "Use a file smaller than 1.5 MB");
  const extension = filename.split(".").pop().toLowerCase();
  let text = "";
  try {
    if (extension === "txt") text = buffer.toString("utf8");
    else if (extension === "pdf") {
      if (buffer.subarray(0, 5).toString() !== "%PDF-")
        throw new Error("Not a PDF");
      const parser = new PDFParse({
        data: new Uint8Array(buffer),
        isEvalSupported: false,
      });
      try {
        const result = await parser.getText({ first: 30 });
        text = result.text;
      } finally {
        await parser.destroy();
      }
    } else if (extension === "docx") {
      const files = unzipSync(new Uint8Array(buffer), {
        filter: (entry) =>
          entry.name === "word/document.xml" && entry.originalSize <= 5_000_000,
      });
      if (!files["word/document.xml"]) throw new Error("Invalid document");
      const parser = new SaxesParser({ xmlns: true });
      let inText = false;
      parser.on("opentag", (tag) => {
        if (tag.local === "t") inText = true;
        if (tag.local === "tab") text += "\t";
      });
      parser.on("text", (value) => {
        if (inText) text += value;
      });
      parser.on("closetag", (tag) => {
        if (tag.local === "t") inText = false;
        if (tag.local === "p") text += "\n";
      });
      parser.write(strFromU8(files["word/document.xml"])).close();
    } else throw new HttpError(400, "Upload TXT, PDF or DOCX");
  } catch (error) {
    if (error.status) throw error;
    throw new HttpError(
      422,
      "This document could not be read. Paste the brief text or try a text-based file.",
    );
  }
  text = text.trim().slice(0, 30000);
  if (!text)
    throw new HttpError(
      422,
      "No readable text found. Scanned documents need OCR; paste the brief text instead.",
    );
  return text;
}
