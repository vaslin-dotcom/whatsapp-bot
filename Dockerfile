FROM node:18-alpine

WORKDIR /app

COPY . .

RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
