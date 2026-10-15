import PDFDocument from "pdfkit";
import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";
const require = createRequire(import.meta.url);
const fontRoot = dirname(require.resolve("@fontsource/noto-sans/package.json"));
export function briefPdf(campaign, creator, brief) {
  return new Promise((resolveResult, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 48,
      info: {
        Title: `${campaign.name} — ${creator.name}`,
        Author: campaign.brand,
      },
    });
    const parts = [];
    doc.on("data", (part) => parts.push(part));
    doc.on("end", () => resolveResult(Buffer.concat(parts)));
    doc.on("error", reject);
    doc.registerFont(
      "Body",
      resolve(fontRoot, "files/noto-sans-latin-400-normal.woff"),
    );
    doc.registerFont(
      "Heading",
      resolve(fontRoot, "files/noto-sans-latin-700-normal.woff"),
    );
    doc
      .font("Heading")
      .fontSize(10)
      .fillColor("#315cf5")
      .text("ORBIT  /  CREATOR CAMPAIGN BRIEF");
    doc.moveDown().fontSize(23).fillColor("#202124").text(campaign.name);
    doc
      .font("Body")
      .fontSize(11)
      .text(`${campaign.brand} · ${creator.name} · ${brief.status}`);
    doc.moveDown();
    const section = (title, body) => {
      if (doc.y > doc.page.height - 140) doc.addPage();
      doc
        .moveDown(0.5)
        .font("Heading")
        .fontSize(12)
        .fillColor("#315cf5")
        .text(title);
      doc.moveDown(0.3).font("Body").fontSize(10).fillColor("#202124");
      if (Array.isArray(body))
        body.forEach((item) => doc.text(`• ${item}`, { lineGap: 3 }));
      else doc.text(String(body || "To be confirmed"), { lineGap: 4 });
      doc.moveDown(0.4);
    };
    section("Campaign audience", campaign.audience);
    section("Format and placement", [
      campaign.format || "To be confirmed",
      campaign.placement || "To be confirmed",
    ]);
    for (const [key, value] of Object.entries(brief.content))
      section(
        key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
        value,
      );
    section(
      "Approval",
      `Status: ${brief.status}. Last saved: ${brief.updated_at}. Final brand and legal review remains with the campaign team.`,
    );
    doc.end();
  });
}
