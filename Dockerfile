FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files first (for caching)
COPY package*.json ./

# Install deps (including dev dependencies for vite)
RUN npm install

# Copy rest of app
COPY . .

# Expose port
EXPOSE 8080

# Run dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

