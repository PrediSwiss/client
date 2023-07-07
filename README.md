# client

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Run End-to-End Tests with [Cypress](https://www.cypress.io/)

```sh
npm run test:e2e:dev
```

This runs the end-to-end tests against the Vite development server.
It is much faster than the production build.

But it's still recommended to test the production build with `test:e2e` before deploying (e.g. in CI environments):

```sh
npm run build
npm run test:e2e
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

### OSRM
docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-extract -p /opt/car.lua /data/switzerland-latest.osm.pbf || echo "osrm-extract failed"




#### nop  
docker pull osrm/osrm-backend:latest

docker run -t -v E:/TB/osrm-data:/data osrm/osrm-backend osrm-extract -p /opt/car.lua /data/switzerland-latest.osm.pbf

docker run -t -v e:/TB/osrm-data:/data osrm/osrm-backend osrm-partition /data/switzerland-latest.osm.pbf

docker run -t -v e:/TB/osrm-data:/data osrm/osrm-backend osrm-customize /data/switzerland-latest.osm.pbf

docker run --name osrm -t -i -p 5000:5000 -v e:/TB/osrm-data:/data osrm/osrm-backend osrm-routed --algorithm mld /data/switzerland-latest.osrm