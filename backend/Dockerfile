FROM node:18-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY src ./src

ENV PORT=3005
EXPOSE 3005

CMD ["npm", "start"]
