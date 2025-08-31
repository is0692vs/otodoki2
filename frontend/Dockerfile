FROM node:18-alpine

WORKDIR /app

ENV CHOKIDAR_USEPOLLING=1

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
