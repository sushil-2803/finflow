# --- STAGE 1: Build & Dependencies ---
FROM node:22-alpine AS builder
WORKDIR /app

# Leverage Docker cache by copying package files first
COPY package*.json ./

# Install ALL dependencies (including devDependencies if needed for a build step)
RUN npm ci

# Copy the rest of your application code
COPY . .

# Optional: Run a build step if you are using TypeScript or a bundler
# RUN npm run build

# Remove development dependencies to keep production light
RUN npm prune --production


# --- STAGE 2: Secure Production Runtime ---
FROM node:22-alpine AS runner
WORKDIR /app

# Establish the exact production environment (No spaces!)
ENV NODE_ENV=production
# Define the default port variable
ENV PORT=5000

# Copy only the necessary production artifacts from the builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./

# Expose the dynamic environment variable port
EXPOSE $PORT

# Security Best Practice: Switch to the built-in, unprivileged 'node' user
USER node

# Start Node directly to handle OS process signals cleanly (SIGTERM)
CMD ["node", "server.js"] 
