# CAD2BIM Studio – 部署说明

## 全线上部署（支持 DWG，用户无需下载）

要实现**用户不下载任何东西、在浏览器中直接上传 DWG 并完成 BIM 化**，需要将应用部署到**可安装 ODA File Converter 的常驻运行环境**，而不能使用 Vercel 等纯 Serverless（其运行环境中无法安装或运行 ODA）。

| 部署方式 | DWG 支持 | 说明 |
|----------|----------|------|
| **Vercel** | 仅 DXF | 当前预览环境；不支持在服务器上安装 ODA。 |
| **Docker / 自建 / PaaS（从 Docker 构建）** | DWG + DXF | 在服务器或镜像中安装一次 ODA，用户全线上传即可。 |

**重要**：在支持 DWG 的部署中**不要设置**环境变量 `VERCEL`，否则应用会认为处于 Vercel 环境并禁用 DWG 转换。

---

## Docker 部署（推荐）

### 1. 获取 ODA File Converter（用于支持 DWG）

1. 打开 [ODA File Converter 下载页](https://www.opendesign.com/guestfiles/oda_file_converter)。
2. 选择 **Linux** 版本，下载 **DEB** 包（例如 `ODAFileConverter_QT6_lnxX64_8.3dll_27.1.deb`，具体以官网为准）。
3. 将下载的 `.deb` 文件放入项目中的 **`docker/oda/`** 目录。  
   - 若不放入：镜像仍可构建并运行，但仅支持 **DXF**，不支持 DWG。

### 2. 构建镜像

在项目根目录执行：

```bash
docker build -t cad2bim .
```

### 3. 运行容器

**方式 A：使用 Docker Compose（推荐）**

项目已包含 `docker-compose.yml`，一键启动并持久化任务目录：

```bash
docker compose up -d
```

访问 `http://localhost:8000`。可选：复制 `.env.example` 为 `.env` 后按需修改环境变量。

**方式 B：直接 docker run**

```bash
docker run -p 8000:8000 cad2bim
```

不要设置 `VERCEL`。如需持久化转换任务目录，可挂载卷：

```bash
docker run -p 8000:8000 -v /path/on/host/data/jobs:/app/data/jobs cad2bim
```

（若应用使用 `CAD2BIM_JOB_DIR` 等环境变量，请相应调整挂载路径。）

访问 `http://localhost:8000` 即可使用。若构建时在 `docker/oda/` 中放置了 ODA 的 .deb，页面会显示 **DWG Ready**，用户可直接上传 DWG 进行 BIM 化。

---

## 使用 PaaS（Railway / Render / Fly.io 等）

1. 在 PaaS 中选择**从 Dockerfile 构建**（不要选“Vercel”或纯 Serverless 运行时）。
2. 确保构建上下文中包含 `docker/oda/`；若需 DWG 支持，在构建前将 ODA 的 .deb 放入该目录并提交，或通过 PaaS 的 build 步骤注入。
3. **不要**在 PaaS 中设置环境变量 `VERCEL`。
4. 暴露端口 8000（或 PaaS 指定的端口），启动命令由 Dockerfile 的 `CMD` 提供即可。

---

## VPS / 自建服务器（Ubuntu / Debian）

1. 安装 Python 3.10+、pip 及系统依赖（如 ODA 所需的 `libxcb-util1`）。
2. 从 [ODA 官网](https://www.opendesign.com/guestfiles/oda_file_converter) 下载 Linux .deb，安装：
   ```bash
   sudo apt-get install -y ./ODAFileConverter_*.deb
   ```
3. 克隆项目，创建虚拟环境并安装依赖：`pip install -r requirements.txt`。
4. **不要**设置 `VERCEL`。使用 uvicorn 启动，例如：
   ```bash
   xvfb-run uvicorn main:app --host 0.0.0.0 --port 8000
   ```
   （`xvfb-run` 用于无显示器环境下避免 ODA 尝试打开 GUI。）

**可选**：若 ODA 安装在非标准路径，可设置环境变量 `ODA_FILE_CONVERTER_PATH` 指向可执行文件路径，应用会优先使用该路径。

---

## 小结

- **全线上、用户不下载**：部署到 Docker / 自建 / PaaS（从 Docker 构建），在服务器或镜像中安装 ODA，且不设置 `VERCEL`。
- **Vercel**：保留现有配置，仅支持 DXF；DWG 需使用本地或上述自建部署。
