.PHONY: build
build:
	@echo "Building the project..."
	@echo "Building the keeper service"
	cd ./backend/service && \
		go mod tidy && \
		go mod vendor && \
		go build -o ./bin/keeper_app ./cmd/main.go
	@echo "Building the auth service"
	cd ./backend/auth && \
		go mod tidy && \
		go mod vendor && \
		go build -o ./bin/auth_app ./cmd/main.go

.PHONY: run_keeper
run_keeper:
	@echo "Running the keeper service..."
	./backend/service/bin/keeper_app --config=./backend/service/config/local.yaml

.PHONY: run_auth
run_auth:
	@echo "Running the auth service..."
	./backend/auth/bin/auth_app --config=./backend/auth/config/local.yaml

.PHONY: run
run:
	@echo "Running the keeper service..."
	./backend/service/bin/keeper_app --config=./backend/service/config/local.yaml &
	@echo "Running the auth service..."
	./backend/auth/bin/auth_app --config=./backend/auth/config/local.yaml &

.PHONY: run_frontend
run_frontend:
	@echo "Running the frontend service..."
	cd ./frontend && python3 -m http.server 3000 --bind 127.0.0.1