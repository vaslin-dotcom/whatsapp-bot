FROM node:18-alpine

# Install git
RUN apk add --no-cache git

WORKDIR /app
COPY . .

RUN chmod +x start.sh

CMD ["sh", "start.sh"]
