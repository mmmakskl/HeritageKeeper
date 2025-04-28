FROM golang:1.24 AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o auth_service ./cmd/main.go

FROM scratch
WORKDIR /
COPY --from=builder /app/auth_service /auth_service
# COPY --from=builder /app/config/config.yaml /sso.yaml

EXPOSE 8082
ENTRYPOINT ["/auth_service", "--config", "/sso.yaml"]
