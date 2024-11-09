# This initial stage uses the node:20.12-alpine3.18 Docker image as a base to build your Angular application.
FROM node:latest as build

# Setting the working directory in the Docker image.
WORKDIR /app

# Copying the package.json and package-lock.json files into the image.
COPY package*.json ./

RUN npm ci

# Copying the rest of your app's source code from your host to your image filesystem.
COPY . .

# This will build your Angular app in production mode.
RUN npm run build  --configuration=production

# This next stage uses the nginx:1.25.3-alpine Docker image as it's base.
FROM nginx:latest

# These ARG and ENV lines allow for optional environment variables. They're not necessary for the setup but can be useful for things like setting a version number

# Copies the custom NGINX configuration file you've written in your project to the right location in your Docker image.
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# This copies the compiled Angular 'dist' directory into the nginx html directory.
COPY --from=build /app/dist/neptun-driver-frontend/browser /usr/share/nginx/html/

# This makes port 8080 available to your host machine.
EXPOSE 80

# This is starting NGINX and making sure it stays running. The "-g 'daemon off;'" part is grabbing the global configuration to modify it.
CMD ["nginx", "-g", "daemon off;"]
