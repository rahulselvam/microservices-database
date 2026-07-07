# Use a lightweight, LTS Node base image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /usr/src/app

# Copy package configuration files first to optimize Docker layer caching
COPY package*.json ./

RUN npm ci --omit=dev

# Copy the rest of your application code
COPY server.js .

# Expose the application network port
EXPOSE 3000

# Run the application
CMD [ "npm", "start" ]