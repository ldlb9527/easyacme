# 多阶段构建
FROM node:18-alpine AS frontend-builder

# 构建前端 - 只复制web目录
WORKDIR /web
COPY web/ ./
RUN npm install && npm run build

FROM golang:1.23-alpine AS backend-builder

# 构建后端 - 复制项目但排除web目录
WORKDIR /easyacme
COPY ./ ./
RUN go env -w GOPROXY=https://goproxy.cn,direct
RUN go mod tidy && CGO_ENABLED=0 GOOS=linux go build -o easyacme-server ./cmd/server

# 最终镜像
FROM alpine:3.19

# 安装必要的软件包
RUN apk add --no-cache \
    nginx \
    bash \
    curl \
    tzdata \
    openssl \
    sed

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 创建应用目录结构
RUN mkdir -p /app/server /app/nginx /app/db

COPY --from=backend-builder /easyacme/easyacme-server /app/server/
COPY --from=frontend-builder /web/dist /app/nginx/dist

# 启动命令：后台启动nginx，然后启动后端服务
CMD ["sh", "-c", "nginx -c /app/nginx/nginx.conf -g 'daemon off;' & cd /app/server && exec ./easyacme-server"]