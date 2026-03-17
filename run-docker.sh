#!/usr/bin/env bash
# 使用 Docker 启动 CAD2BIM Studio，访问 http://localhost:8000
# 若需 DWG 支持，请先将 ODA 的 .deb 放入 docker/oda/ 再执行此脚本
set -e
cd "$(dirname "$0")"
echo "构建并启动容器..."
docker compose up -d --build
echo "已启动。访问: http://localhost:8000"
echo "查看日志: docker compose logs -f app"
