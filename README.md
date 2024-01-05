<img src="src/assets/images/logo.png?raw=true" width="33%" />

# ebpv3

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
yarn
```

### Compile and Hot-Reload for Development

```sh
yarn dev
```

### Compile and Minify for Production

```sh
yarn build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
yarn test:unit
```

### Run End-to-End Tests with [Cypress](https://www.cypress.io/)

```sh
yarn test:e2e:dev
```

This runs the end-to-end tests against the Vite development server.
It is much faster than the production build.

But it's still recommended to test the production build with `test:e2e` before deploying (e.g. in CI environments):

```sh
yarn build
yarn test:e2e
```

### Lint with [ESLint](https://eslint.org/)

```sh
yarn lint
```

## Development:

To run locally please follow the following steps:
#### Installation
```bash
export NPM_TOKEN=...
yarn
```

### Set up hosting local environment
Create a file called `.env.development` in the root of the project and add your variables provided by your administrator.

#### Usage:
```bash
docker-compose up --build
```
### Setup cloud local environment
Create a file called `.env.development` in the `functions/` folder and add your variables provided by your administrator.

#### Configuration
> **Note:** Cloud functions require a `seed/` folder containing a `data-export` from firebase to launch local emulators

To create a new seed run the following commands:
```bash
gcloud firestore export gs://qualle-development.appspot.com/data-export
gsutil -m cp -R gs://qualle-development.appspot.com/data-export . 
```
#### Installation
```bash
yarn
```
#### Usage
```bash
cd functions

NODE_ENV=development
export NPM_TOKEN=...

yarn start:dev
```
> **Note:** This will build project and launch firebase local emulator suite
#### Visit App:
```bash
localhost:3000/
```
#### Visit firebase emulator ui:
```bash
localhost:4000/
```
