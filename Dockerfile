FROM node:20.4-alpine3.17

RUN npm install -g npm@9.8.0

WORKDIR /var/www/training

RUN apk add bash

ENTRYPOINT npm ci && chmod -R 777 ./node_modules && ./node_modules/.bin/ng serve --host=0.0.0.0 --disable-host-check
