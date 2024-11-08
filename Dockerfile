# Use a Node.js base image with Alpine
FROM node:20.4-alpine3.17

# Install a specific version of npm globally
RUN npm install -g npm@9.8.0

# Set the working directory
WORKDIR /var/www/neptun-frontend

# Install bash (if needed for your application)
RUN apk add bash

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies using npm ci
RUN npm ci

# Copy the rest of the application code
COPY . .

# Give permissions to node_modules (if needed)
RUN chmod -R 777 ./node_modules

# Expose a port (typically for Angular, it’s 4200)
EXPOSE 4200

# Define the command to start your Angular app
ENTRYPOINT ["./node_modules/.bin/ng", "serve", "--host=0.0.0.0", "--disable-host-check"]
