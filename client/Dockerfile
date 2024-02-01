FROM node:20-alpine@sha256:2f46fd49c767554c089a5eb219115313b72748d8f62f5eccb58ef52bc36db4ad
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
