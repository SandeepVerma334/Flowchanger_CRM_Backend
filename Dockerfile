FROM node:18 

COPY package.json .

RUN npm install

COPY . .

EXPOSE 8000

RUN npx prisma generate

CMD ["npm","run","start"]