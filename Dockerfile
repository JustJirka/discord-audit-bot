FROM node:18-slim

# Install Python and build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Symlink python to python3 to ensure spawn('python') works
RUN ln -s /usr/bin/python3 /usr/bin/python

WORKDIR /app

COPY package*.json ./
RUN npm install --production

# Install Python dependencies
COPY requirements.txt ./
# --break-system-packages is required for Debian 12+ (Bookworm) based images
RUN pip3 install -r requirements.txt --break-system-packages --no-cache-dir

COPY . .

CMD ["npm", "start"]
