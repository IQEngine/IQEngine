FROM node:22-alpine@sha256:9fcc1a6da2b9eee38638df75c5f826e06e9c79f6a0f97f16ed98fe0ebb0725c0
LABEL org.opencontainers.image.source="https://github.com/IQEngine/IQEngine"
WORKDIR /app
COPY package*.json ./
# Install dependencies (npm ci makes sure the exact versions in the lockfile gets installed)
RUN npm ci
COPY . .
RUN npm run build
# Set the environment to production
ENV NODE_ENV production
EXPOSE 3000
# Start the app
CMD [ "npx", "serve", "build" ]
