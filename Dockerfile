FROM node

WORKDIR /app
ADD . /app

RUN npm install --production

EXPOSE 3000

ENV HOSTNAME db.transport.rest
ENV PORT 3000

CMD ["npm", "start"]
