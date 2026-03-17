# CAD2BIM Studio – Deployment

## Full-online deployment (DWG support, no user download)

To let **users upload DWG in the browser and run BIM conversion without installing anything**, deploy to an **environment where ODA File Converter can be installed and run** (e.g. Docker, VPS, PaaS). Pure Serverless (e.g. Vercel) cannot install or run ODA.

| Deployment        | DWG support | Notes                                                                 |
|-------------------|------------|-----------------------------------------------------------------------|
| **Vercel**        | DXF only   | Preview environment; ODA cannot be installed on the server.         |
| **Docker / VPS / PaaS (Dockerfile)** | DWG + DXF | Install ODA once on the server or in the image; users upload in the browser. |

**Important**: Do **not** set the `VERCEL` environment variable in DWG-capable deployments, or the app will disable DWG conversion.

---

## Docker (recommended)

### 1. Get ODA File Converter (for DWG support)

1. Open the [ODA File Converter download page](https://www.opendesign.com/guestfiles/oda_file_converter).
2. Choose **Linux** and download the **DEB** package (e.g. `ODAFileConverter_QT6_lnxX64_8.3dll_27.1.deb`; exact name may vary).
3. Place the downloaded `.deb` in the project’s **`docker/oda/`** directory.  
   - If you skip this: the image still builds and runs, but only **DXF** is supported (no DWG).

### 2. Build the image

From the project root:

```bash
docker build -t cad2bim .
```

### 3. Run the container

**Option A: Docker Compose (recommended)**

The project includes `docker-compose.yml`. Start and persist job data:

```bash
docker compose up -d
```

Open `http://localhost:8000`. Optionally copy `.env.example` to `.env` and adjust environment variables.

**Option B: docker run**

```bash
docker run -p 8000:8000 cad2bim
```

Do not set `VERCEL`. To persist job output, mount a volume:

```bash
docker run -p 8000:8000 -v /path/on/host/data/jobs:/app/data/jobs cad2bim
```

(Adjust the path if you use `CAD2BIM_JOB_DIR` or similar.)

If you placed an ODA `.deb` in `docker/oda/` when building, the UI will show **DWG Ready** and users can upload DWG for BIM conversion.

---

## PaaS (Railway, Render, Fly.io, etc.)

1. Use **build from Dockerfile** (not a Vercel or other Serverless runtime).
2. Ensure the build context includes `docker/oda/`; for DWG support, add the ODA `.deb` there before building or inject it in the PaaS build step.
3. Do **not** set the `VERCEL` environment variable.
4. Expose port 8000 (or the port your PaaS uses). The Dockerfile `CMD` provides the start command.

---

## VPS or self-hosted (Ubuntu / Debian)

1. Install Python 3.10+, pip, and system dependencies (e.g. `libxcb-util1` for ODA).
2. Download the Linux .deb from [ODA](https://www.opendesign.com/guestfiles/oda_file_converter) and install:
   ```bash
   sudo apt-get install -y ./ODAFileConverter_*.deb
   ```
3. Clone the project, create a venv, and install dependencies: `pip install -r requirements.txt`.
4. Do **not** set `VERCEL`. Start with uvicorn, e.g.:
   ```bash
   xvfb-run uvicorn main:app --host 0.0.0.0 --port 8000
   ```
   (`xvfb-run` avoids ODA trying to open a GUI on a headless server.)

**Optional**: If ODA is installed in a non-standard path, set `ODA_FILE_CONVERTER_PATH` to the converter executable; the app will use it first.

---

## Summary

- **Full-online, no user install**: Deploy with Docker / VPS / PaaS (from Dockerfile), install ODA on the server or in the image, and do not set `VERCEL`.
- **Vercel**: Keeps current config; DXF only. Use a local or self-hosted deployment for DWG.
