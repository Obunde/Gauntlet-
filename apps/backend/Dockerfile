FROM python:3.11-slim

WORKDIR /app

# Install system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend source code and install dependencies
COPY . .
RUN pip install --no-cache-dir -e .

# Expose FastAPI port
EXPOSE 8000

# Run FastAPI backend API
CMD ["uvicorn", "gauntlet.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
