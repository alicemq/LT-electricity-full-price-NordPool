FROM node:18-alpine as build

WORKDIR /app

# Build argument for NODE_ENV
ARG NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application (always build, but use different targets)
RUN npm run build

# Development stage (for hot-reload)
FROM node:18-alpine as development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port for Vite dev server
EXPOSE 5173

# Health check for development
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5173 || exit 1

# Start Vite dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Production stage
FROM nginx:alpine as production

# Copy built application from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 