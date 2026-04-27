# STAGE 1: Build
FROM node:20-slim AS build
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# Triggers the 'production' configuration in angular.json
RUN npx ng build --configuration production

# STAGE 2: Serve
FROM nginx:alpine

# Copy your custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output (path based on your angular.json project name)
COPY --from=build /usr/src/app/dist/malta-cabs/browser /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]