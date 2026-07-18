FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci --ignore-scripts 2>/dev/null || npm install --ignore-scripts
EXPOSE 3002
CMD ["npm", "run", "dev", "-w", "services/voice"]
