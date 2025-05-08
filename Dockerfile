# Build
FROM golang:latest AS builder

WORKDIR /kayphos

COPY server/gin /kayphos

RUN go mod tidy

RUN go build cmd/server/main.go

# Runtime
FROM ubuntu:latest

RUN apt-get update && apt-get install -y openssl dos2unix

WORKDIR /kayphos

COPY --from=builder /kayphos/main .
COPY entrypoint_server.sh /kayphos

RUN chmod +x /kayphos/entrypoint_server.sh

RUN dos2unix entrypoint_server.sh

EXPOSE 8080

# CMD ["./main"]

ENTRYPOINT ["/kayphos/entrypoint_server.sh"]
