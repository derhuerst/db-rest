FROM node:alpine as builder
WORKDIR /app

# install dependencies
RUN apk add --update git bash
ADD package.json /app
RUN npm install

# build documentation
ADD . /app
RUN npm run build

# ---

FROM node:alpine
LABEL org.opencontainers.image.title="db-rest"
LABEL org.opencontainers.image.description="A clean REST API wrapping around the Deutsche Bahn API."
LABEL org.opencontainers.image.authors="Jannis R <mail@jannisr.de>"
LABEL org.opencontainers.image.documentation="https://github.com/derhuerst/db-rest/tree/5"
LABEL org.opencontainers.image.source="https://github.com/derhuerst/db-rest"
LABEL org.opencontainers.image.revision="5"
LABEL org.opencontainers.image.licenses="ISC"
WORKDIR /app

# install dependencies
ADD package.json /app
RUN npm install --production && npm cache clean --force

# add source code
ADD . /app
COPY --from=builder /app/docs ./docs

EXPOSE 3000

ENV HOSTNAME v5.db.transport.rest
ENV PORT 3000

CMD ["node", "index.js"]
