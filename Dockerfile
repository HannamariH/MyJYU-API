FROM node:14

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

ENV TZ Europe/Helsinki

CMD ["node", "index.js"]