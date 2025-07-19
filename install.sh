#!/bin/bash
set -e

# 配置信息
REGISTRY="registry.cn-hangzhou.aliyuncs.com"
NAMESPACE="ldlb"
IMAGE_NAME="easyacme"
VERSION="0.0.2"

# 默认安装目录和端口
DEFAULT_INSTALL_DIR="./easyacme"
DEFAULT_PORT="81"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# 渐变色定义 - 仿Gemini-cli
GRADIENT1='\033[38;5;33m'   # 深蓝
GRADIENT2='\033[38;5;39m'   # 蓝色
GRADIENT3='\033[38;5;45m'   # 青色
GRADIENT4='\033[38;5;51m'   # 浅青色

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_logo() {
    echo ""
    echo -e "${GRADIENT1}    ███████ ${GRADIENT2} █████  ${GRADIENT3}███████ ${GRADIENT4}██    ██    ${GRADIENT1}  █████  ${GRADIENT2}  ██████ ${GRADIENT3}███    ███ ${GRADIENT4}███████ ${NC}"
    echo -e "${GRADIENT1}    ██      ${GRADIENT2}██   ██ ${GRADIENT3}██      ${GRADIENT4}██    ██    ${GRADIENT1} ██   ██ ${GRADIENT2} ██      ${GRADIENT3}████  ████ ${GRADIENT4}██      ${NC}"
    echo -e "${GRADIENT1}    █████   ${GRADIENT2}███████ ${GRADIENT3}███████ ${GRADIENT4}██    ██    ${GRADIENT1} ███████ ${GRADIENT2} ██      ${GRADIENT3}██ ████ ██ ${GRADIENT4}█████   ${NC}"
    echo -e "${GRADIENT1}    ██      ${GRADIENT2}██   ██ ${GRADIENT3}     ██ ${GRADIENT4}██    ██    ${GRADIENT1} ██   ██ ${GRADIENT2} ██      ${GRADIENT3}██  ██  ██ ${GRADIENT4}██      ${NC}"
    echo -e "${GRADIENT1}    ███████ ${GRADIENT2}██   ██ ${GRADIENT3}███████ ${GRADIENT4}█████████   ${GRADIENT1} ██   ██ ${GRADIENT2}  ██████ ${GRADIENT3}██      ██ ${GRADIENT4}███████ ${NC}"
    echo ""
    echo -e "${GRADIENT3}                   ${BOLD}版本号: $VERSION${NC}"
    echo ""
}

# 生成随机字符串
generate_random_string() {
    local length=${1:-16}
    cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w $length | head -n 1
}

# 检测系统架构
detect_arch() {
    local arch=$(uname -m)
    case $arch in
        x86_64)
            echo "amd64"
            ;;
        aarch64|arm64)
            echo "arm64"
            ;;
        *)
            log_error "不支持的架构: $arch"
            exit 1
            ;;
    esac
}

# 检查Docker和Docker Compose是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi

    if ! docker info >/dev/null 2>&1; then
        log_error "Docker 未运行或无权限访问"
        exit 1
    fi

    # 检查Docker Compose命令
    if docker compose version >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker compose"
        log_success "检测到 Docker Compose 插件"
    elif command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker-compose"
        log_success "检测到 docker-compose 命令"
    else
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
}

# 检测操作系统
detect_os() {
    case "$(uname -s)" in
        Linux*)
            echo "Linux"
            ;;
        Darwin*)
            echo "macOS"
            ;;
        CYGWIN*|MINGW*|MSYS*)
            echo "Windows"
            ;;
        *)
            echo "Unknown"
            ;;
    esac
}

# 检查端口是否被占用
check_port() {
    local port=$1
    local os=$(detect_os)
    
    case $os in
        "Windows")
            # Windows下使用netstat -an，完全静默
            if command -v netstat >/dev/null 2>&1; then
                if netstat -an 2>/dev/null | grep -q ":$port "; then
                    log_error "端口 $port 已被占用，请选择其他端口"
                    exit 1
                fi
            else
                log_warn "无法检测端口占用情况，请确保端口 $port 未被占用"
            fi
            ;;
        "macOS")
            # macOS优先使用lsof
            if command -v lsof >/dev/null 2>&1; then
                if lsof -i :$port >/dev/null 2>&1; then
                    log_error "端口 $port 已被占用，请选择其他端口"
                    exit 1
                fi
            elif command -v netstat >/dev/null 2>&1; then
                if netstat -an 2>/dev/null | grep -q ":$port "; then
                    log_error "端口 $port 已被占用，请选择其他端口"
                    exit 1
                fi
            else
                log_warn "无法检测端口占用情况，请确保端口 $port 未被占用"
            fi
            ;;
        "Linux")
            # Linux优先使用ss
            if command -v ss >/dev/null 2>&1; then
                if ss -tuln 2>/dev/null | grep -q ":$port "; then
                    log_error "端口 $port 已被占用，请选择其他端口"
                    exit 1
                fi
            elif command -v netstat >/dev/null 2>&1; then
                if netstat -tuln 2>/dev/null | grep -q ":$port "; then
                    log_error "端口 $port 已被占用，请选择其他端口"
                    exit 1
                fi
            elif command -v lsof >/dev/null 2>&1; then
                if lsof -i :$port >/dev/null 2>&1; then
                    log_error "端口 $port 已被占用，请选择其他端口"
                    exit 1
                fi
            else
                log_warn "无法检测端口占用情况，请确保端口 $port 未被占用"
            fi
            ;;
        *)
            log_warn "无法检测端口占用情况，请确保端口 $port 未被占用"
            ;;
    esac
}

# 显示帮助信息
show_help() {
    cat << EOF
easyacme 一键安装脚本

用法: 
    $0 [选项]

选项:
    --install-dir <目录>    指定安装目录 (默认: $DEFAULT_INSTALL_DIR)
    --port <端口>          指定访问端口 (默认: $DEFAULT_PORT)
    -h, --help            显示此帮助信息

示例:
    # 使用默认配置安装
    $0

    # 指定安装目录
    $0 --install-dir /opt/easyacme

    # 指定端口
    $0 --port 8080

    # 指定安装目录和端口
    $0 --install-dir /opt/easyacme --port 8080

    # 通过curl直接安装
    curl -fsSL https://your-domain.com/install.sh | bash

EOF
}

# 解析命令行参数
INSTALL_DIR=""
PORT=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        --install-dir)
            if [ -z "$2" ]; then
                log_error "--install-dir 需要指定目录路径"
                show_help
                exit 1
            fi
            INSTALL_DIR="$2"
            shift 2
            ;;
        --port)
            if [ -z "$2" ]; then
                log_error "--port 需要指定端口号"
                show_help
                exit 1
            fi
            PORT="$2"
            shift 2
            ;;
        -*)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
        *)
            log_error "未知参数: $1"
            show_help
            exit 1
            ;;
    esac
done

# 使用默认值
if [ -z "$INSTALL_DIR" ]; then
    INSTALL_DIR="$DEFAULT_INSTALL_DIR"
fi

if [ -z "$PORT" ]; then
    PORT="$DEFAULT_PORT"
fi

# 验证端口是否为数字
if ! [[ "$PORT" =~ ^[0-9]+$ ]] || [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
    log_error "端口必须是1-65535之间的数字"
    exit 1
fi

# 完整镜像名称
FULL_IMAGE_NAME="${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:${VERSION}"

# 显示Logo
show_logo

echo "==================== easyacme 一键安装脚本 ===================="
echo ""

log_info "安装目录: $INSTALL_DIR"
log_info "访问端口: $PORT"
log_info "镜像地址: $FULL_IMAGE_NAME"
log_info "执行命令: $(basename $0) --install-dir $INSTALL_DIR --port $PORT"

# 检测系统信息
OS=$(detect_os)
ARCH=$(detect_arch)
log_info "检测到架构: $ARCH"
log_info "检测到操作系统: $OS"

# 检查Docker和Docker Compose
log_info "检查 Docker 和 Docker Compose..."
check_docker

# 检查端口占用
log_info "检查端口占用..."
check_port "$PORT"
log_success "端口 $PORT 可用"

# 检查安装目录
log_info "检查安装目录..."
if [ -e "$INSTALL_DIR" ]; then
    if [ "$(ls -A "$INSTALL_DIR" 2>/dev/null)" ]; then
        log_error "安装目录 $INSTALL_DIR 不为空，请清空或选择其他目录"
        exit 1
    fi
else
    log_info "创建安装目录 $INSTALL_DIR"
    mkdir -p "$INSTALL_DIR"
fi

log_success "安装目录检查通过"

# 生成随机配置
log_info "生成配置文件..."

DB_USER="easyacme"
DB_PASSWORD=$(generate_random_string 24)
DB_NAME="easyacme"
SESSION_SECRET=$(generate_random_string 32)

# 创建配置目录
mkdir -p "$INSTALL_DIR/server"
mkdir -p "$INSTALL_DIR/nginx"
mkdir -p "$INSTALL_DIR/db"

# 生成应用配置文件
cat > "$INSTALL_DIR/server/config.yaml" << EOF
# easyacme 配置文件
app:
  env: "prod"
  port: 8080
  session_secret: "$SESSION_SECRET"

database:
  host: "db"
  port: 5432
  user: "$DB_USER"
  password: "$DB_PASSWORD"
  name: "$DB_NAME"

log:
  level: "info"
  file: "logs/app.log"
EOF

# 生成nginx配置文件
cat > "$INSTALL_DIR/nginx/nginx.conf" << 'EOF'
events {}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    server {
        listen 80;
        root /app/nginx/dist;
        index index.html;
        
        # API 代理到后端服务
        location /api/ {
            proxy_pass http://localhost:8080;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # 所有其他请求的SPA路由处理
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
EOF

# 生成环境变量文件
cat > "$INSTALL_DIR/.env" << EOF
# easyacme Docker Compose 环境变量
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
PORT=$PORT
INSTALL_DIR=$INSTALL_DIR
EOF

# 生成docker-compose.yml文件
cat > "$INSTALL_DIR/docker-compose.yml" << EOF
version: '3.8'
services:
  db:
    image: postgres:14-alpine
    container_name: easyacme-db
    restart: always
    environment:
      POSTGRES_DB: \${DB_NAME}
      POSTGRES_USER: \${DB_USER}
      POSTGRES_PASSWORD: \${DB_PASSWORD}
    volumes:
      - ./db/data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - easyacme-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${DB_USER} -d \${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5

  easyacme:
    image: $FULL_IMAGE_NAME
    container_name: easyacme-app
    restart: always
    ports:
      - "\${PORT:-81}:80"
    volumes:
      - ./server/config.yaml:/app/server/config.yaml
      - ./nginx/nginx.conf:/app/nginx/nginx.conf
    depends_on:
      db:
        condition: service_healthy
    networks:
      - easyacme-network
networks:
  easyacme-network:
    driver: bridge
EOF

log_success "配置文件生成完成"

# 进入安装目录
cd "$INSTALL_DIR"

# 构建和启动服务
log_info "启动 easyacme 服务..."
$DOCKER_COMPOSE_CMD up -d

# 等待服务启动
log_info "等待服务启动..."
sleep 10

# 初始化超级管理员
log_info "初始化超级管理员..."

# 等待API服务完全启动
max_retries=10
retry_count=0
while [ $retry_count -lt $max_retries ]; do
    if curl -s "http://localhost:$PORT/api/ping" >/dev/null 2>&1; then
        log_success "API服务已就绪"
        break
    fi
    retry_count=$((retry_count + 1))
    log_info "等待API服务启动... ($retry_count/$max_retries)"
    sleep 2
done

if [ $retry_count -eq $max_retries ]; then
    log_error "API服务启动超时"
    exit 1
fi

# 调用初始化用户接口
HTTP_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "http://localhost:$PORT/api/init/user" \
    -H "Content-Type: application/json" \
    -d '{}')

# 分离HTTP状态码和响应体
HTTP_STATUS=$(echo "$HTTP_RESPONSE" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
INIT_RESPONSE=$(echo "$HTTP_RESPONSE" | sed -E 's/HTTPSTATUS:[0-9]*$//')

if [ "$HTTP_STATUS" = "200" ]; then
    # 解析响应体中的用户名和密码
    ADMIN_USERNAME=$(echo "$INIT_RESPONSE" | sed -n 's/.*"username":"\([^"]*\)".*/\1/p')
    ADMIN_PASSWORD=$(echo "$INIT_RESPONSE" | sed -n 's/.*"password":"\([^"]*\)".*/\1/p')
else
    log_error "初始化用户失败，HTTP状态码: $HTTP_STATUS"
    log_error "响应内容: $INIT_RESPONSE"
    exit 1
fi

# 输出安装结果
echo ""
show_logo
echo "==================== 🎉 安装完成 ===================="
echo ""
log_success "easyacme 已成功安装到 $INSTALL_DIR"
echo ""
echo -e "${CYAN}  📱 访问地址: ${BOLD}http://localhost:$PORT${NC}"
echo -e "${CYAN}  👤 管理员用户名: ${BOLD}${ADMIN_USERNAME}${NC}"
echo -e "${CYAN}  🔑 管理员密码: ${BOLD}${ADMIN_PASSWORD}${NC}"
echo ""
echo -e "${YELLOW}  💡 温馨提示:${NC}"
echo -e "${YELLOW}     • 请妥善保存管理员密码${NC}"
echo -e "${YELLOW}     • 如需停止服务，请运行: cd $INSTALL_DIR && $DOCKER_COMPOSE_CMD down${NC}"
echo -e "${YELLOW}     • 如需彻底卸载服务，请运行: cd $INSTALL_DIR && $DOCKER_COMPOSE_CMD down -v --remove-orphans${NC}"
echo ""
