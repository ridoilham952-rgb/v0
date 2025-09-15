FROM node:18-alpine

WORKDIR /app

# Create logs directory
RUN mkdir -p logs

COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/

EXPOSE 3001

CMD ["npm", "start"]
