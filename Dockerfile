# Use Node.js 18 LTS for Koyeb/Railway compatibility
FROM node:18-alpine

# Set environment variables (PORT will be provided by the platform)
ENV NODE_ENV=production

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm install --production
RUN cd backend && npm install --production

# Copy application files
COPY . .

# Start the application from root directory
CMD ["node", "src/server.js"]
