FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node server.js package.json ./
COPY --chown=node:node dist ./dist
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
USER node
CMD ["node", "server.js"]
