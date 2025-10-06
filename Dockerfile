# Use Node.js with Python support
FROM node:18-alpine

# Install Python and pip
RUN apk add --no-cache \
    python3 \
    py3-pip \
    python3-dev \
    build-base

# Set working directory
WORKDIR /app

# Create and activate Python virtual environment
RUN python3 -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"

# Copy Python requirements and install Python dependencies in venv
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