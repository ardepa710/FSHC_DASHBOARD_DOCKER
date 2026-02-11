FROM node:20-alpine

WORKDIR /app

# Install OpenSSL and other dependencies required by Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code
COPY src ./src/

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3002

CMD ["node", "src/index.js"]
