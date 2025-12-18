FROM node:22-alpine

# Install git for cloning repositories
RUN apk add --no-cache git

WORKDIR /app

COPY package.json ./
RUN npm install

COPY src ./src

ENV PORT=3005
EXPOSE 3005

CMD ["npm", "start"]
