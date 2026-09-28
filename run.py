"""
TERRA-GUARD: Unified Single-Server & Runner Script.
Runs both the Frontend Web App and Backend REST API under a single combined URL:
    http://localhost:8000
"""

import os
import sys
import subprocess
import webbrowser
import argparse
import time

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    try:
        if sys.stdout and hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        if sys.stderr and hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")
FRONTEND_DIST = os.path.join(FRONTEND_DIR, "dist")

def ensure_frontend_built():
    """Builds the frontend if dist is missing or rebuild is requested."""
    if not os.path.exists(FRONTEND_DIST) or not os.path.exists(os.path.join(FRONTEND_DIST, "index.html")):
        print("[*] Building frontend assets for combined single-host deployment...")
        cmd = "npm run build"
        subprocess.run(cmd, cwd=FRONTEND_DIR, shell=True, check=True)
        print("[+] Frontend build completed successfully.")

def is_port_in_use(host: str, port: int) -> bool:
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex((host, port)) == 0

def run_combined(host="127.0.0.1", port=8000, reload=False, open_browser=True):
    """Runs the unified FastAPI server hosting both backend API & frontend UI."""
    ensure_frontend_built()
    
    # Check if port is already occupied
    if is_port_in_use(host, port):
        print("=" * 65)
        print(f"⚠️  PORT {port} IS ALREADY IN USE!")
        print("=" * 65)
        print(f"Another process or server is already running on http://{host}:{port}.")
        print("To resolve this, you can:")
        print(f"  1. Close the other running instance or terminal window.")
        print(f"  2. Or specify a different port: python run.py --port {port + 1}")
        print("=" * 65)
        sys.exit(1)

    # Inject paths
    app_dir = os.path.join(BACKEND_DIR, "app")
    ml_dir = os.path.join(ROOT_DIR, "ml")
    for p in [app_dir, ml_dir, ROOT_DIR, BACKEND_DIR]:
        if p not in sys.path:
            sys.path.insert(0, p)
            
    import uvicorn
    # pyrefly: ignore [missing-import]
    from app.main import app

    target_url = f"http://{host}:{port}"
    print("=" * 65)
    print("  TERRA-GUARD Combined Platform is launching!")
    print(f"  Web Application & API:      {target_url}")
    print(f"  Interactive Swagger Docs:   {target_url}/docs")
    print("=" * 65)

    if open_browser:
        def launch_browser():
            time.sleep(1.5)
            webbrowser.open(target_url)
        import threading
        threading.Thread(target=launch_browser, daemon=True).start()

    uvicorn.run(app, host=host, port=port)

def run_dev_concurrent():
    """Runs both FastAPI backend and Vite dev server concurrently for development."""
    import concurrent.futures
    print("[*] Starting Backend & Frontend in concurrent development mode...")
    
    def run_backend():
        backend_cmd = [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"]
        subprocess.run(backend_cmd, cwd=BACKEND_DIR)

    def run_frontend():
        frontend_cmd = "npm run dev"
        subprocess.run(frontend_cmd, cwd=FRONTEND_DIR, shell=True)

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        executor.submit(run_backend)
        time.sleep(1)
        executor.submit(run_frontend)

def main():
    parser = argparse.ArgumentParser(description="TERRA-GUARD Unified Runner")
    parser.add_argument("--dev", action="store_true", help="Run both FastAPI & Vite dev servers concurrently")
    parser.add_argument("--port", type=int, default=8000, help="Port to serve combined application (default: 8000)")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Host address (default: 127.0.0.1)")
    parser.add_argument("--no-browser", action="store_true", help="Do not auto-open browser")
    parser.add_argument("--build", action="store_true", help="Force rebuild of frontend before starting")

    args = parser.parse_args()

    if args.build:
        print("[*] Rebuilding frontend...")
        subprocess.run("npm run build", cwd=FRONTEND_DIR, shell=True, check=True)

    if args.dev:
        run_dev_concurrent()
    else:
        run_combined(host=args.host, port=args.port, open_browser=not args.no_browser)

if __name__ == "__main__":
    main()
