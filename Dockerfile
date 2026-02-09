FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies (faster + smaller)
RUN npm install --omit=dev

# Copy source code
COPY . .

# Your backend runs on port 5000 (keep same as your container mapping)
EXPOSE 5000

# Start backend
CMD ["npm", "start"]
