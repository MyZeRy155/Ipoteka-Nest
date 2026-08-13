FROM node:24.19.0-alpine

WORKDIR /src

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

RUN chmod +x entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]