FROM node:alpine

WORKDIR /app
ADD . /app

RUN apk add --update git bash && \
	npm install --production && \
	apk del git && \
	rm -rf /tmp/* /var/cache/apk/*

EXPOSE 3000

ENV HOSTNAME 3.db.transport.rest
ENV PORT 3000

CMD ["/bin/sh", "docker-entrypoint.sh"]
