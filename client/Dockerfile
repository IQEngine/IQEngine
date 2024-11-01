FROM node:23-alpine@sha256:1467ea23cce893347696b155b9e00e7f0ac7d21555eb6f27236f1328212e045e
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
