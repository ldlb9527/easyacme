# EasyACME

English | [中文](README.md)

## Introduction
Visualized ACME client

## Quick Install
* Requires `docker` and `docker compose` (or `docker-compose`)
```shell
curl -fsSL -k https://115.190.153.121/install.sh | bash -s -- --install-dir ./easyacme --port 8081
```

## Local Development
* Configure the postgresql database connection in `config.yaml`
* Run backend and frontend
    ```shell
    cd easyacme
    go mod tidy
    go run ./cmd/server/main.go
    
    cd web
    npm install
    npm run dev
    ```

## Local Build
* If you want to build the image from source code, there is a simple script
```shell
cd easyacme
./build.sh
```
* If you only want to build for the current host architecture, modify the build command in `build.sh` to `docker build -t "${FULL_IMAGE_NAME}" .`

## Feedback Welcome