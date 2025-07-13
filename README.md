## 介绍
可视化的ACME客户端

## 一键安装命令
* 依赖`docker`和`docker compose`(或`docker-compose`)
```shell
curl -fsSL -k https://115.190.153.121/install.sh | bash -s -- --install-dir ./easyacme --port 8081
```

## 本地启动
* 配置`config,yaml`的postgresql数据库连接
* 接着运行后端和前端
    ```shell
    cd easyacme
    go mod tidy
    go run ./cmd/server/main.go
    
    cd web
    npm install
    npm run dev
    ```

## 本地构建
* 如果你要从源码构建镜像,有个粗糙的脚本
```shell
cd easyacme
./build.sh
```
* 如果仅构建当前主机架构,修改为`build.sh`的构建命令为为`docker build -t "${FULL_IMAGE_NAME}" .`

## 欢迎反馈和贡献
