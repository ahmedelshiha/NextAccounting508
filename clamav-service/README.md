ClamAV microservice

This directory contains a lightweight Flask-based wrapper around ClamAV suitable for scanning uploaded files.

Files:
- Dockerfile: builds the container with clamav and Flask app
- start.sh: entrypoint that starts clamd, periodic freshclam updates and runs gunicorn
- app.py: Flask API exposing /health, /scan, /update
- requirements.txt: Python dependencies
- docker-compose.yml: local-compose for development

Environment:
- AV_API_KEY: API key required by the Flask API if set

Usage (local):
1. Copy .env.example to .env and set AV_API_KEY
2. docker-compose up --build
3. Wait until health endpoint returns healthy: http://localhost:8080/health

Security:
- Protect the /scan and /update endpoints via AV_API_KEY and network-level controls (VPC, SSH tunnels, or reverse proxy with auth).
