# Use the official lightweight Node.js 20 image.
FROM node:20-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
COPY package*.json ./

# Install only production dependencies to keep the image small.
RUN npm install --only=production

# Copy local code to the container image.
COPY . .

# Match your preferred port. 
# Cloud Run will still override this with its own PORT env var, 
# which your code is already set up to handle.
ENV PORT 3000
EXPOSE 3000

# Run the web service on container startup.
CMD [ "node", "server.js" ]