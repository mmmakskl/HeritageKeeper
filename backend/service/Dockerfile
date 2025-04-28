FROM golang:1.24 AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o keeper_service ./cmd/main.go

FROM scratch
WORKDIR /
COPY --from=builder /app/keeper_service /keeper_service
# COPY --from=builder /app/config/config.yaml /keeper.yaml

EXPOSE 8081
ENTRYPOINT ["/keeper_service", "--config", "/keeper.yaml"]
