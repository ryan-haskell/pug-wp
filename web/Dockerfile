FROM node:8

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN npm install -g nodemon --silent

COPY package.json .
COPY package-lock.json .
RUN npm install --silent

CMD ["npm", "run", "dev"]