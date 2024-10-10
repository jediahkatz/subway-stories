# Use an official Node.js runtime as a parent image
FROM node:16

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install any needed packages
RUN npm install --production

# Copy the rest of the application code, excluding the SQLite DB
COPY . .

# Create a directory for the SQLite database
RUN mkdir -p /app/data

# Expose the port your app runs on
EXPOSE 3000

# Start the Node.js server
CMD ["node", "server.js"]
