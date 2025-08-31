# otodoki2web

This is a web application with a frontend and a backend, containerized with Docker.

## Architecture

- **Frontend:** Next.js application running on port 3000.
- **Backend:** FastAPI application running on port 8000.
- **Containerization:** Docker and Docker Compose are used to build and run the services.

## Setup and Startup

1.  **Prerequisites:**
    *   Docker
    *   Docker Compose

2.  **Build and start the services:**

    ```bash
    docker-compose up --build -d
    ```

    Or, using the Makefile:

    ```bash
    make up
    ```

3.  **Stop the services:**

    ```bash
    docker-compose down
    ```

    Or:

    ```bash
    make down
    ```

## How to Verify

1.  **Check the frontend:**
    Open your browser and navigate to [http://localhost:3000](http://localhost:3000). You should see the Next.js starter page.

2.  **Check the backend health:**
    Run the following command in your terminal:

    ```bash
    curl http://localhost:8000/health
    ```

    You should see the following response:

    ```json
    {"status":"ok"}
    ```

3.  **Check the API documentation:**
    - [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI)
    - [http://localhost:8000/redoc](http://localhost:8000/redoc) (ReDoc)

## Important Notes

- **CORS:** CORS is not configured in this setup. Direct API calls from the frontend to the backend in the browser will fail. This will be addressed in a future update.
- **Adding Dependencies:**
    - **Frontend:** Add dependencies to `frontend/package.json` and then rebuild the `web` service: `docker-compose up --build -d web`.
    - **Backend:** Add dependencies to `backend/requirements.txt` and then rebuild the `api` service: `docker-compose up --build -d api`.

## Directory Structure

```
.
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   └── main.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .dockerignore
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   ├── package.json
│   └── ... (Next.js files)
├── docker-compose.yml
├── Makefile
└── README.md
```