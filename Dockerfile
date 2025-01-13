# Use the official Node.js image
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Bundle app source
COPY . .

# Expose the port your app runs on
EXPOSE 8080

# Command to run the app
CMD ["node", "server.js"]