# Build the static site, then serve it with a tiny static server.
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build            # emits ./out (static export)

FROM node:20-slim AS run
WORKDIR /app
RUN npm install -g serve@14
COPY --from=build /app/out ./out
EXPOSE 3000
CMD ["serve", "-s", "out", "-l", "3000"]
