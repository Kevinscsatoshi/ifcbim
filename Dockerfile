# CAD2BIM Studio - full-online deployment with ODA (DWG support)
# Build: place ODA File Converter Linux .deb in docker/oda/ then:
#   docker build -t cad2bim .
# Run: do NOT set VERCEL; use e.g.:
#   docker run -p 8000:8000 cad2bim

FROM python:3.12-slim-bookworm

WORKDIR /app

# System deps for ODA (headless + libs) and optional xvfb for ODA GUI
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        xvfb \
        libxcb-util1 \
    && rm -rf /var/lib/apt/lists/*

# Install ODA File Converter if .deb is present in docker/oda/ (see docker/oda/README.txt)
COPY docker/oda/ /tmp/oda/
RUN apt-get update \
    && for f in /tmp/oda/*.deb; do [ -f "$$f" ] && apt-get install -y --no-install-recommends "$$f"; done \
    && rm -rf /var/lib/apt/lists/* /tmp/oda

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Application
COPY app/ ./app/
COPY modules/ ./modules/
COPY main.py .
COPY api/ ./api/
COPY static/ ./static/
COPY templates/ ./templates/

EXPOSE 8000

# Do not set VERCEL so DWG conversion is enabled. xvfb-run avoids ODA GUI on headless Linux.
CMD ["xvfb-run", "--server-args=-screen 0 1024x768x24", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
