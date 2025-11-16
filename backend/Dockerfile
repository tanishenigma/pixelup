FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
	VIRTUAL_ENV=/opt/venv \
	PATH="/opt/venv/bin:$PATH"

RUN apt-get update && apt-get install -y --no-install-recommends \
	build-essential \
	ca-certificates \
	wget \
	ffmpeg \
	libgl1 \
	libglib2.0-0 \
	libsm6 \
	libxext6 \
	libxrender1 \
	&& rm -rf /var/lib/apt/lists/*

RUN python -m venv $VIRTUAL_ENV

WORKDIR /app

# Install Python deps
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --upgrade pip setuptools wheel && pip install -r /app/requirements.txt

# Copy app code and model files (if any)
COPY backend/ /app/
COPY model/ /app/model/

EXPOSE 8080

# Use gunicorn for production server
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "app:app", "--workers", "1", "--threads", "4"]
