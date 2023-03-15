FROM node:16

ARG NPM_TOKEN
ENV NPM_TOKEN $NPM_TOKEN

WORKDIR /app
COPY package*.json ./
COPY yarn.lock ./
COPY .npmrc ./

RUN npm config set //npm.pkg.github.com/:_authToken $NPM_TOKEN
RUN yarn

COPY . .

CMD ["yarn", "dev"]