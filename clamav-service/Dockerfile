FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive

# Install ClamAV and dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      clamav clamav-daemon clamav-freshclam \
      gcc libssl-dev make curl && \
    rm -rf /var/lib/apt/lists/*

# Configure ClamAV
RUN sed -i 's/^Foreground .*$/Foreground true/' /etc/clamav/clamd.conf || true && \
    sed -i 's/^Foreground .*$/Foreground true/' /etc/clamav/freshclam.conf || true && \
    mkdir -p /var/run/clamav && \
    chown clamav:clamav /var/run/clamav

# Install Python dependencies
WORKDIR /app
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY app.py start.sh /app/
RUN chmod +x /app/start.sh

# Initialize virus database
RUN freshclam --quiet || true

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

EXPOSE 8080
CMD ["/app/start.sh"]
