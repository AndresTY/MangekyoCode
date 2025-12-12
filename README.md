

# MangekyoCode

[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker\&logoColor=white)]()
[![Python](https://img.shields.io/badge/Python-3776AB?logo=python\&logoColor=white)]()
[![Vue.js](https://img.shields.io/badge/Vue.js-4FC08D?logo=vue.js\&logoColor=white)]()
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript\&logoColor=black)]()
[![Nginx](https://img.shields.io/badge/Nginx-009639?logo=nginx\&logoColor=white)]()

**MangekyoCode** is a modular, containerized **online code judge** built with Docker, Python, Vue.js, JavaScript, and Nginx.
It provides a secure sandbox for code execution, a REST API, and a modern web interface — all orchestrated via Docker Compose.



## Project Structure

```
/
├── backend/           # Backend API (Python / JS depending on your stack)
├── frontend/          # Web UI (Vue.js)
├── judge/             # Secure execution engine
├── nginx/             # Reverse proxy
├── .env.example       # Environment variables template
├── docker-compose.yml # Docker orchestration
└── README.md
```

* Docker
* Docker Compose
* (Optional) Node.js for frontend development


## Configuration

1. Copy environment template:

   ```bash
   cp .env.example .env
   ```

2. Customize:

   * Ports
   * Database URLs
   * Judge time/memory limits
   * Runtime images


## Running with Docker Compose

### Build & start

```bash
docker compose build
docker compose up -d
```

### Logs

```bash
docker compose logs -f
```

### Shutdown

```bash
docker compose down
```
