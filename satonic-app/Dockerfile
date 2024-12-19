# Use the official Node.js 18 LTS image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY public ./public
COPY src ./src
COPY components.json ./components.json
COPY next.config.ts ./next.config.ts
COPY tailwind.config.ts ./tailwind.config.ts
COPY tsconfig.json ./tsconfig.json
COPY postcss.config.mjs ./postcss.config.mjs
COPY eslint.config.mjs ./eslint.config.mjs

# Build the Next.js app
RUN npm run build

# Expose the port Next.js uses
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
