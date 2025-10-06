# Use Node.js with Python support (Debian-based for PyTorch compatibility)
FROM node:18-bullseye-slim

# Install Python and build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set working directory
WORKDIR /app

# Create and activate Python virtual environment
RUN python3 -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"

# Install PyTorch CPU-only first (more reliable)
RUN pip install torch --index-url https://download.pytorch.org/whl/cpu

# Copy Python requirements and install other Python dependencies in venv
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy package files and install Node.js dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]