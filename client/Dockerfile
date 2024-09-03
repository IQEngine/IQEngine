FROM node:22-alpine@sha256:ed9736a13b88ba55cbc08c75c9edac8ae7f72840482e40324670b299336680c1
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
