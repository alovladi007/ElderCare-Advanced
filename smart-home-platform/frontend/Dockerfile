FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 24616

CMD ["npm", "run", "dev", "--", "--host"]
