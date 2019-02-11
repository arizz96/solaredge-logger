FROM arm64v8/node:8-alpine
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN apk add git

COPY . .
ENV PATH /usr/src/app/node_modules/.bin:$PATH
RUN npm install

CMD ["node", "solarpower_logger.js"]
