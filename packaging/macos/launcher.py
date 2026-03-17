from __future__ import annotations

import os
import signal
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
import webbrowser
from pathlib import Path

APP_NAME = "CAD2BIM Studio"
HOST = "127.0.0.1"
PORT = int(os.getenv("CAD2BIM_PORT", "8765"))
HEALTH_URL = f"http://{HOST}:{PORT}/health"
APP_URL = f"http://{HOST}:{PORT}"


def support_dir() -> Path:
    return Path.home() / "Library" / "Application Support" / APP_NAME


def logs_dir() -> Path:
    return Path.home() / "Library" / "Logs" / APP_NAME


def pid_file() -> Path:
    return support_dir() / "server.pid"


def log_file() -> Path:
    return logs_dir() / "server.log"


def server_ready() -> bool:
    try:
        with urllib.request.urlopen(HEALTH_URL, timeout=1.5) as response:
            return response.status == 200
    except (urllib.error.URLError, TimeoutError):
        return False


def process_running(pid: int) -> bool:
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def remove_stale_pid() -> None:
    path = pid_file()
    if path.exists():
        path.unlink()


def read_pid() -> int | None:
    path = pid_file()
    if not path.exists():
        return None
    try:
        return int(path.read_text(encoding="utf-8").strip())
    except ValueError:
        remove_stale_pid()
        return None


def ensure_runtime_dirs() -> None:
    support_dir().mkdir(parents=True, exist_ok=True)
    logs_dir().mkdir(parents=True, exist_ok=True)
    (support_dir() / "jobs").mkdir(parents=True, exist_ok=True)


def wait_for_server(timeout_seconds: float = 20.0) -> bool:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        if server_ready():
            return True
        time.sleep(0.4)
    return False


def ensure_port_is_free() -> None:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.5)
        if sock.connect_ex((HOST, PORT)) == 0 and not server_ready():
            raise RuntimeError(f"Port {PORT} is already in use by another process.")


def spawn_server() -> None:
    app_root = Path(os.environ["CAD2BIM_APP_ROOT"])
    embedded_python = Path(os.environ["CAD2BIM_EMBEDDED_PYTHON"])

    env = os.environ.copy()
    env["CAD2BIM_JOB_DIR"] = str(support_dir() / "jobs")
    env["PYTHONUNBUFFERED"] = "1"

    with log_file().open("ab") as stream:
        child = subprocess.Popen(
            [
                str(embedded_python),
                "-m",
                "uvicorn",
                "main:app",
                "--host",
                HOST,
                "--port",
                str(PORT),
            ],
            cwd=app_root,
            env=env,
            stdout=stream,
            stderr=subprocess.STDOUT,
            start_new_session=True,
        )

    pid_file().write_text(str(child.pid), encoding="utf-8")


def main() -> int:
    ensure_runtime_dirs()

    pid = read_pid()
    if pid and not process_running(pid):
        remove_stale_pid()
        pid = None

    if server_ready():
        webbrowser.open(APP_URL)
        return 0

    if pid is not None:
        if not wait_for_server():
            raise RuntimeError(f"CAD2BIM server did not become ready. Inspect logs at {log_file()}")
        webbrowser.open(APP_URL)
        return 0

    ensure_port_is_free()

    spawn_server()

    if not wait_for_server():
        raise RuntimeError(f"CAD2BIM server did not become ready. Inspect logs at {log_file()}")

    webbrowser.open(APP_URL)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        raise SystemExit(signal.SIGINT)
    except Exception as exc:
        print(f"Failed to launch {APP_NAME}: {exc}", file=sys.stderr)
        raise SystemExit(1)
