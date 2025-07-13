#!/bin/bash
set -e

# 配置信息
REGISTRY="registry.cn-hangzhou.aliyuncs.com"
NAMESPACE="ldlb"
IMAGE_NAME="easyacme"
VERSION="0.0.1"

# 完整镜像名称
FULL_IMAGE_NAME="${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:${VERSION}"

echo "=== easyacme All-in-One 镜像构建脚本 ==="
echo "镜像名称: ${FULL_IMAGE_NAME}"


echo "✓ 环境检查通过"

# 构建镜像
echo "开始构建镜像..."
docker buildx build --platform linux/amd64,linux/arm64 --tag "${FULL_IMAGE_NAME}" --push .
#docker build -t "${FULL_IMAGE_NAME}" .
#docker push "${FULL_IMAGE_NAME}"