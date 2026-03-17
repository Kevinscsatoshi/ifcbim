#!/usr/bin/env bash
# 在项目根目录运行本脚本，用虚拟环境启动服务，浏览器访问 http://localhost:8000
set -e
cd "$(dirname "$0")"
if [[ ! -d .venv ]]; then
  echo "未找到 .venv，请先执行: python3 -m venv .venv && .venv/bin/pip install -r requirements.txt"
  exit 1
fi
echo "启动服务: http://localhost:8000"
exec .venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000
