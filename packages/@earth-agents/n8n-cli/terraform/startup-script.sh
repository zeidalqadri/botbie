#!/bin/bash
# Startup script for Compute Engine deployment

# Update system
apt-get update && apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker $USER

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create n8n directory
mkdir -p /opt/earth-agents-n8n/{workflows,credentials}
cd /opt/earth-agents-n8n

# Create docker-compose.yml
cat > docker-compose.yml << EOF
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      - DATABASE_TYPE=postgresdb
      - DATABASE_POSTGRESDB_HOST=${db_host}
      - DATABASE_POSTGRESDB_PORT=5432
      - DATABASE_POSTGRESDB_DATABASE=n8n
      - DATABASE_POSTGRESDB_USER=n8n
      - DATABASE_POSTGRESDB_PASSWORD=${postgres_password}
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${n8n_user}
      - N8N_BASIC_AUTH_PASSWORD=${n8n_password}
      - N8N_ENCRYPTION_KEY=${n8n_encryption_key}
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - EXECUTIONS_PROCESS=main
      - N8N_METRICS=true
    volumes:
      - ./n8n_data:/home/node/.n8n
      - ./workflows:/home/node/.n8n/workflows
      - ./credentials:/home/node/.n8n/credentials
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - n8n
    restart: always
EOF

# Create nginx configuration
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream n8n {
        server n8n:5678;
    }

    server {
        listen 80;
        server_name _;
        
        location / {
            proxy_pass http://n8n;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            
            # Increase timeouts for long-running workflows
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }
    }
}
EOF

# Create systemd service
cat > /etc/systemd/system/earth-agents-n8n.service << EOF
[Unit]
Description=Earth Agents N8N
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/earth-agents-n8n
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable earth-agents-n8n
systemctl start earth-agents-n8n

# Install monitoring
apt-get install -y htop iotop

# Setup automatic backups
cat > /opt/earth-agents-n8n/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/earth-agents-n8n/backups"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
docker exec $(docker ps -qf "name=n8n") n8n export:workflow --all --output=/tmp/workflows_$DATE.json
docker cp $(docker ps -qf "name=n8n"):/tmp/workflows_$DATE.json $BACKUP_DIR/
find $BACKUP_DIR -name "workflows_*.json" -mtime +7 -delete
EOF
chmod +x /opt/earth-agents-n8n/backup.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/earth-agents-n8n/backup.sh") | crontab -

echo "Earth Agents N8N deployment completed!"