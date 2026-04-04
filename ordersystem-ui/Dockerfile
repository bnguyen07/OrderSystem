FROM node:20-alpine

WORKDIR /app

# Copy dependency definition files securely
COPY package.json package-lock.json ./
RUN npm install

# Copy actual React code over
COPY . .

# Build the heavily optimized Next.js Production HTML/JS files
RUN npm run build

# Open the Windows connection port
EXPOSE 3000

# Fire up the blazing fast production server
CMD ["npm", "run", "start"]
