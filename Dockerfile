FROM node:14

# Install global dependencies for project
RUN yarn global add firebase-tools
RUN yarn global add firebase-functions
RUN yarn global add @vue/cli

WORKDIR /app
COPY package*.json ./

RUN yarn

COPY . .

CMD ["yarn", "run", "dev", "--host", "0.0.0.0"]