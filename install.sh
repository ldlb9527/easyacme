#!/bin/bash
set -e

# 配置信息
REGISTRY="registry.cn-hangzhou.aliyuncs.com"
NAMESPACE="ldlb"
IMAGE_NAME="easyacme"
VERSION="0.0.3"

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

# 默认语言设置
LANG_CODE="zh-CN"

# 语言选择函数
select_language() {
    # 定义语言选项
    languages=("简体中文" "English")
    selected=0

    # 隐藏光标
    tput civis

    # 清理函数
    cleanup() {
        tput cnorm  # 显示光标
        tput sgr0   # 重置终端属性
    }

    # 设置退出时清理
    trap cleanup EXIT

    # 显示菜单函数
    show_menu() {
        clear
        echo -e "${YELLOW}请选择语言 / Select Language${NC}"
        for i in "${!languages[@]}"; do
            if [ $i -eq $selected ]; then
                echo -e "${GREEN}> ${languages[$i]} <${NC}"
            else
                echo -e "  ${languages[$i]}"
            fi
        done

        echo ""
        echo -e "${BLUE}使用上下键或数字(1-2)选择，回车确认 / Use ↑↓ keys or numbers(1-2) to select, Enter to confirm${NC}"
    }

    # 主循环
    while true; do
        show_menu

        # 读取单个字符
        read -rsn1 key

        # 处理数字输入
        if [[ $key =~ ^[12]$ ]]; then
            selected=$((key - 1))
        # 处理特殊键（箭头键）
        elif [[ $key == $'\x1b' ]]; then
            read -rsn2 key
            case $key in
                '[A') # 上箭头
                    ((selected--))
                    if [ $selected -lt 0 ]; then
                        selected=$((${#languages[@]} - 1))
                    fi
                    ;;
                '[B') # 下箭头
                    ((selected++))
                    if [ $selected -ge ${#languages[@]} ]; then
                        selected=0
                    fi
                    ;;
            esac
        elif [[ $key == "" ]]; then # 回车键
            break
        fi
    done

    # 显示光标
    tput cnorm

    # 根据选择设置语言环境
    case $selected in
        0)
            LANG_CODE="zh-CN"
            ;;
        1)
            LANG_CODE="en-US"
            ;;
    esac
}

# 语言字符串定义
declare -A MSG
# 中文字符串
MSG[zh-CN,INFO]="信息"
MSG[zh-CN,SUCCESS]="成功"
MSG[zh-CN,WARN]="警告"
MSG[zh-CN,ERROR]="错误"
MSG[zh-CN,INSTALL_DIR]="安装目录"
MSG[zh-CN,PORT]="访问端口"
MSG[zh-CN,IMAGE]="镜像地址"
MSG[zh-CN,COMMAND]="执行命令"
MSG[zh-CN,ARCH]="检测到架构"
MSG[zh-CN,OS]="检测到操作系统"
MSG[zh-CN,CHECK_DOCKER]="检查 Docker 和 Docker Compose..."
MSG[zh-CN,DOCKER_COMPOSE_FOUND]="检测到 Docker Compose 插件"
MSG[zh-CN,DOCKER_COMPOSE_CMD_FOUND]="检测到 docker-compose 命令"
MSG[zh-CN,PORT_CHECK]="检查端口占用..."
MSG[zh-CN,PORT_AVAILABLE]="端口可用"
MSG[zh-CN,PORT_OCCUPIED]="端口已被占用，请选择其他端口"
MSG[zh-CN,DIR_CHECK]="检查安装目录..."
MSG[zh-CN,DIR_CREATE]="创建安装目录"
MSG[zh-CN,DIR_NOT_EMPTY]="安装目录不为空，请清空或选择其他目录"
MSG[zh-CN,DIR_CHECK_PASS]="安装目录检查通过"
MSG[zh-CN,GEN_CONFIG]="生成配置文件..."
MSG[zh-CN,CONFIG_DONE]="配置文件生成完成"
MSG[zh-CN,START_SERVICE]="启动 easyacme 服务..."
MSG[zh-CN,WAIT_SERVICE]="等待服务启动..."
MSG[zh-CN,INIT_ADMIN]="初始化超级管理员..."
MSG[zh-CN,API_READY]="API服务已就绪"
MSG[zh-CN,WAIT_API]="等待API服务启动..."
MSG[zh-CN,API_TIMEOUT]="API服务启动超时"
MSG[zh-CN,INIT_USER_FAIL]="初始化用户失败，HTTP状态码"
MSG[zh-CN,RESPONSE]="响应内容"
MSG[zh-CN,INSTALL_COMPLETE]="安装完成"
MSG[zh-CN,INSTALL_SUCCESS]="easyacme 已成功安装到"
MSG[zh-CN,ACCESS_URL]="访问地址"
MSG[zh-CN,ADMIN_USERNAME]="管理员用户名"
MSG[zh-CN,ADMIN_PASSWORD]="管理员密码"
MSG[zh-CN,TIPS]="温馨提示"
MSG[zh-CN,TIP_PASSWORD]="请妥善保存管理员密码"
MSG[zh-CN,TIP_STOP]="如需停止服务，请运行"
MSG[zh-CN,TIP_UNINSTALL]="如需彻底卸载服务，请运行"

# 英文字符串
MSG[en-US,INFO]="INFO"
MSG[en-US,SUCCESS]="SUCCESS"
MSG[en-US,WARN]="WARNING"
MSG[en-US,ERROR]="ERROR"
MSG[en-US,INSTALL_DIR]="Installation directory"
MSG[en-US,PORT]="Access port"
MSG[en-US,IMAGE]="Image address"
MSG[en-US,COMMAND]="Command executed"
MSG[en-US,ARCH]="Detected architecture"
MSG[en-US,OS]="Detected operating system"
MSG[en-US,CHECK_DOCKER]="Checking Docker and Docker Compose..."
MSG[en-US,DOCKER_COMPOSE_FOUND]="Docker Compose plugin detected"
MSG[en-US,DOCKER_COMPOSE_CMD_FOUND]="docker-compose command detected"
MSG[en-US,PORT_CHECK]="Checking port availability..."
MSG[en-US,PORT_AVAILABLE]="Port is available"
MSG[en-US,PORT_OCCUPIED]="Port is occupied, please choose another port"
MSG[en-US,DIR_CHECK]="Checking installation directory..."
MSG[en-US,DIR_CREATE]="Creating installation directory"
MSG[en-US,DIR_NOT_EMPTY]="Installation directory is not empty, please clear or choose another directory"
MSG[en-US,DIR_CHECK_PASS]="Installation directory check passed"
MSG[en-US,GEN_CONFIG]="Generating configuration files..."
MSG[en-US,CONFIG_DONE]="Configuration files generated successfully"
MSG[en-US,START_SERVICE]="Starting easyacme service..."
MSG[en-US,WAIT_SERVICE]="Waiting for service startup..."
MSG[en-US,INIT_ADMIN]="Initializing super administrator..."
MSG[en-US,API_READY]="API service is ready"
MSG[en-US,WAIT_API]="Waiting for API service to start..."
MSG[en-US,API_TIMEOUT]="API service startup timed out"
MSG[en-US,INIT_USER_FAIL]="Failed to initialize user, HTTP status code"
MSG[en-US,RESPONSE]="Response content"
MSG[en-US,INSTALL_COMPLETE]="Installation Complete"
MSG[en-US,INSTALL_SUCCESS]="easyacme has been successfully installed to"
MSG[en-US,ACCESS_URL]="Access URL"
MSG[en-US,ADMIN_USERNAME]="Admin username"
MSG[en-US,ADMIN_PASSWORD]="Admin password"
MSG[en-US,TIPS]="Tips"
MSG[en-US,TIP_PASSWORD]="Please keep the admin password safe"
MSG[en-US,TIP_STOP]="To stop the service, run"
MSG[en-US,TIP_UNINSTALL]="To completely uninstall the service, run"

# 先检查是否需要显示帮助信息
NEED_HELP=false
for arg in "$@"; do
    if [[ "$arg" == "-h" || "$arg" == "--help" ]]; then
        NEED_HELP=true
        break
    fi
done

# 如果不需要显示帮助，则执行语言选择
if [ "$NEED_HELP" != "true" ]; then
    select_language
fi

# 获取语言消息
get_message() {
    local key=$1
    echo "${MSG[$LANG_CODE,$key]}"
}

# 多语言日志函数
log_info() {
    echo -e "${BLUE}[$(get_message "INFO")]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(get_message "SUCCESS")]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[$(get_message "WARN")]${NC} $1"
}

log_error() {
    echo -e "${RED}[$(get_message "ERROR")]${NC} $1"
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
        log_success "$(get_message "DOCKER_COMPOSE_FOUND")"
    elif command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker-compose"
        log_success "$(get_message "DOCKER_COMPOSE_CMD_FOUND")"
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
                    log_error "$(get_message "PORT_OCCUPIED")"
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
                    log_error "$(get_message "PORT_OCCUPIED")"
                    exit 1
                fi
            elif command -v netstat >/dev/null 2>&1; then
                if netstat -an 2>/dev/null | grep -q ":$port "; then
                    log_error "$(get_message "PORT_OCCUPIED")"
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
                    log_error "$(get_message "PORT_OCCUPIED")"
                    exit 1
                fi
            elif command -v netstat >/dev/null 2>&1; then
                if netstat -tuln 2>/dev/null | grep -q ":$port "; then
                    log_error "$(get_message "PORT_OCCUPIED")"
                    exit 1
                fi
            elif command -v lsof >/dev/null 2>&1; then
                if lsof -i :$port >/dev/null 2>&1; then
                    log_error "$(get_message "PORT_OCCUPIED")"
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

# 多语言帮助信息
show_help_zh-CN() {
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

show_help_en-US() {
    cat << EOF
easyacme One-Click Installation Script

Usage: 
    $0 [options]

Options:
    --install-dir <directory>    Specify installation directory (default: $DEFAULT_INSTALL_DIR)
    --port <port>               Specify access port (default: $DEFAULT_PORT)
    -h, --help                 Show this help information

Examples:
    # Install with default configuration
    $0

    # Specify installation directory
    $0 --install-dir /opt/easyacme

    # Specify port
    $0 --port 8080

    # Specify installation directory and port
    $0 --install-dir /opt/easyacme --port 8080

    # Install directly via curl
    curl -fsSL https://your-domain.com/install.sh | bash

EOF
}

# 显示帮助信息
show_help() {
    show_help_en-US
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
                if [ "$LANG_CODE" == "zh-CN" ]; then
                    log_error "--install-dir 需要指定目录路径"
                else
                    log_error "--install-dir requires a directory path"
                fi
                show_help
                exit 1
            fi
            INSTALL_DIR="$2"
            shift 2
            ;;
        --port)
            if [ -z "$2" ]; then
                if [ "$LANG_CODE" == "zh-CN" ]; then
                    log_error "--port 需要指定端口号"
                else
                    log_error "--port requires a port number"
                fi
                show_help
                exit 1
            fi
            PORT="$2"
            shift 2
            ;;
        -*)
            if [ "$LANG_CODE" == "zh-CN" ]; then
                log_error "未知选项: $1"
            else
                log_error "Unknown option: $1"
            fi
            show_help
            exit 1
            ;;
        *)
            if [ "$LANG_CODE" == "zh-CN" ]; then
                log_error "未知参数: $1"
            else
                log_error "Unknown parameter: $1"
            fi
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
    if [ "$LANG_CODE" == "zh-CN" ]; then
        log_error "端口必须是1-65535之间的数字"
    else
        log_error "Port must be a number between 1-65535"
    fi
    exit 1
fi

# 完整镜像名称
FULL_IMAGE_NAME="${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:${VERSION}"

# 显示Logo
show_logo

if [ "$LANG_CODE" == "zh-CN" ]; then
    echo "==================== easyacme 一键安装脚本 ===================="
else
    echo "==================== easyacme One-Click Installation Script ===================="
fi
echo ""

log_info "$(get_message "INSTALL_DIR"): $INSTALL_DIR"
log_info "$(get_message "PORT"): $PORT"
log_info "$(get_message "IMAGE"): $FULL_IMAGE_NAME"
log_info "$(get_message "COMMAND"): $(basename $0) --install-dir $INSTALL_DIR --port $PORT"

# 检测系统信息
OS=$(detect_os)
ARCH=$(detect_arch)
log_info "$(get_message "ARCH"): $ARCH"
log_info "$(get_message "OS"): $OS"

# 检查Docker和Docker Compose
log_info "$(get_message "CHECK_DOCKER")"
check_docker

# 检查端口占用
log_info "$(get_message "PORT_CHECK")"
check_port "$PORT"
log_success "$(get_message "PORT_AVAILABLE"): $PORT"

# 检查安装目录
log_info "$(get_message "DIR_CHECK")"
if [ -e "$INSTALL_DIR" ]; then
    if [ "$(ls -A "$INSTALL_DIR" 2>/dev/null)" ]; then
        log_error "$(get_message "DIR_NOT_EMPTY"): $INSTALL_DIR"
        exit 1
    fi
else
    log_info "$(get_message "DIR_CREATE"): $INSTALL_DIR"
    mkdir -p "$INSTALL_DIR"
fi

log_success "$(get_message "DIR_CHECK_PASS")"

# 生成随机配置
log_info "$(get_message "GEN_CONFIG")"

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
  language: "$LANG_CODE"

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

log_success "$(get_message "CONFIG_DONE")"

# 进入安装目录
cd "$INSTALL_DIR"

# 构建和启动服务
log_info "$(get_message "START_SERVICE")"
$DOCKER_COMPOSE_CMD up -d

# 等待服务启动
log_info "$(get_message "WAIT_SERVICE")"
sleep 10

# 初始化超级管理员
log_info "$(get_message "INIT_ADMIN")"

# 等待API服务完全启动
max_retries=10
retry_count=0
while [ $retry_count -lt $max_retries ]; do
    if curl -s "http://localhost:$PORT/api/ping" >/dev/null 2>&1; then
        log_success "$(get_message "API_READY")"
        break
    fi
    retry_count=$((retry_count + 1))
    log_info "$(get_message "WAIT_API")... ($retry_count/$max_retries)"
    sleep 2
done

if [ $retry_count -eq $max_retries ]; then
    log_error "$(get_message "API_TIMEOUT")"
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
    log_error "$(get_message "INIT_USER_FAIL"): $HTTP_STATUS"
    log_error "$(get_message "RESPONSE"): $INIT_RESPONSE"
    exit 1
fi

# 输出安装结果
echo ""
show_logo
echo "==================== 🎉 $(get_message "INSTALL_COMPLETE") ===================="
echo ""
log_success "$(get_message "INSTALL_SUCCESS") $INSTALL_DIR"
echo ""
echo -e "${CYAN}  📱 $(get_message "ACCESS_URL"): ${BOLD}http://localhost:$PORT${NC}"
echo -e "${CYAN}  👤 $(get_message "ADMIN_USERNAME"): ${BOLD}${ADMIN_USERNAME}${NC}"
echo -e "${CYAN}  🔑 $(get_message "ADMIN_PASSWORD"): ${BOLD}${ADMIN_PASSWORD}${NC}"
echo ""
echo -e "${YELLOW}  💡 $(get_message "TIPS"):${NC}"
echo -e "${YELLOW}     • $(get_message "TIP_PASSWORD")${NC}"
echo -e "${YELLOW}     • $(get_message "TIP_STOP"): cd $INSTALL_DIR && $DOCKER_COMPOSE_CMD down${NC}"
echo -e "${YELLOW}     • $(get_message "TIP_UNINSTALL"): cd $INSTALL_DIR && $DOCKER_COMPOSE_CMD down -v --remove-orphans${NC}"
echo ""
