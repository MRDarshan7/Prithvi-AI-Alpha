# Prithvi AI - Voice-Based Farmer Assistant with Weather Intelligence

Production-ready selection-round demo with:
- FastAPI backend (modular REST API)
- Dataset-based crop disease matching (JSON knowledge base + NLP token similarity)
- Real weather ingestion from OpenWeatherMap
- React + Tailwind mobile-friendly frontend with voice input using Web Speech API

## Project Structure

```text
backend/
  app/
    api/
    core/
    data/
    models/
    schemas/
    services/
  requirements.txt
frontend/
  src/
    components/
    services/
  package.json
docker-compose.yml
```

## 1) Backend Setup (Linux / Ubuntu)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# edit .env and set OPENWEATHER_API_KEY
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
```

API test:

```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"query":"my tomato leaves have yellow spots and brown rings","lat":11.94,"lon":79.80}'
```

## 2) Frontend Setup

```bash
cd frontend
cp .env.example .env
# set VITE_API_BASE_URL to backend URL, e.g. http://SERVER_IP:8000
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

## 3) Docker Deployment (AMD EPYC Ubuntu Server)

Prerequisites:
- Docker Engine 24+
- Docker Compose plugin

```bash
cp backend/.env.example backend/.env
# edit backend/.env with real OPENWEATHER_API_KEY
docker compose up -d --build
```

Services:
- Frontend: `http://SERVER_IP:5173`
- Backend API: `http://SERVER_IP:8000/docs`

## 4) Native Production Deployment (systemd + Nginx)

### Backend service

Create `/etc/systemd/system/prithvi-backend.service`:

```ini
[Unit]
Description=Prithvi AI FastAPI Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/opt/prithvi-ai/backend
EnvironmentFile=/opt/prithvi-ai/backend/.env
ExecStart=/opt/prithvi-ai/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now prithvi-backend
sudo systemctl status prithvi-backend
```

### Frontend static hosting + reverse proxy

Build frontend:

```bash
cd /opt/prithvi-ai/frontend
npm ci
npm run build
```

Copy `dist/` to `/var/www/prithvi-ai` and use this Nginx block:

```nginx
server {
    listen 80;
    server_name your-domain-or-ip;

    root /var/www/prithvi-ai;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Adjust frontend env:
- `VITE_API_BASE_URL=https://your-domain-or-ip/api`

## 5) Notes on Architecture

- Disease detection is dataset-driven from `backend/app/data/diseases.json`
- Matching uses symptom token overlap + phrase hit ratio (not hard-coded if/else disease logic)
- Weather advisory uses real-time weather + near-term forecast rain signal from OpenWeatherMap
- Voice recognition languages supported in UI: `en-IN`, `hi-IN`, `ta-IN`
