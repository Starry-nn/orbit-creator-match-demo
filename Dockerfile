FROM node:24-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4180 DATABASE_PATH=/var/lib/orbit/orbit.sqlite
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY server ./server
COPY product ./product
COPY assets ./assets
COPY index.html app.js styles.css pdf-export.js ./
RUN mkdir -p /var/lib/orbit && chown node:node /var/lib/orbit
USER node
EXPOSE 4180
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node","server/index.mjs"]
