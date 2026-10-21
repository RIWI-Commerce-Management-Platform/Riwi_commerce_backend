# Use the official Node.js image as the base image
FROM node:24

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the NestJS application
RUN npm run build

# Command to run the application
# This is the command that will be executed when the container starts. It runs the NestJS application in development mode.
CMD ["sh", "-c", "npm run migration:run && npm run start:dev"]