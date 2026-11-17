# Backend Dockerfile for FastAPI application
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    ENVIRONMENT=production

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libpangoft2-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy application code
COPY . .

# Expose default port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import requests, os; requests.get(f'http://localhost:{os.getenv(\"PORT\", 8000)}/api/health')" || exit 1

# Run application with dynamic PORT (Render injects $PORT, fallback to 8000)
CMD ["sh", "-c", "uvicorn app_main:app --host 0.0.0.0 --port ${PORT:-8000}"]
