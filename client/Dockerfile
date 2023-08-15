FROM node:20-alpine@sha256:80f3be1363191811dd25cc8cb966241a30555d95a082b69487435c9e09236bb7 
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