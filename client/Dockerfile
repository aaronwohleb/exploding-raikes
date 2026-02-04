FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Fixes hot reload issues in Docker for windows
ENV WATCHPACK_POLLING=true

# Start React development server Using Vite instead of react-scripts
CMD ["npm", "run", "dev"]
