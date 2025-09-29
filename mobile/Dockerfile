# Dockerfile for React Native mobile development with Expo
FROM node:18-alpine

# Install basic utilities
RUN apk add --no-cache git

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port for Expo dev server
EXPOSE 8081
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

# Start the Expo development server
CMD ["npm", "start"]