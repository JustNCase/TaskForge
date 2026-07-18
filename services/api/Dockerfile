FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci --ignore-scripts 2>/dev/null || npm install --ignore-scripts
EXPOSE 3001
CMD ["npm", "run", "dev", "-w", "services/api"]
