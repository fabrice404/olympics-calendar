FROM node:lts-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM base AS build
WORKDIR /app
COPY . .
RUN npm run build

FROM node:lts-alpine AS runner
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=build /app/dist .
ENV DEBUG=olympics-calendar:*
CMD ["node", "index.js"]
