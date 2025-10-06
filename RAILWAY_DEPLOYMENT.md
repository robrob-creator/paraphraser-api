# Railway Deployment Guide - Python AI Support

## 🚀 Deploy with Python T5 Model Support

### Prerequisites
- GitHub repository connected to Railway
- No additional environment variables needed

### Deployment Configuration

This project uses **Docker** deployment on Railway (not Nixpacks) to ensure proper Python + Node.js support:

- **`Dockerfile`**: Custom container with Node.js 18 + Python 3
- **`railway.toml`**: Railway configuration for Docker builds
- **`requirements.txt`**: Python dependencies (transformers, torch, etc.)

### Quick Deploy Steps

1. **Connect Repository**: Link your GitHub repo to Railway
2. **Automatic Detection**: Railway will detect `railway.toml` and use Docker builder
3. **Python Installation**: Docker will install Python dependencies during build
4. **Deploy**: No additional configuration needed!

### Build Process

Railway will execute these steps automatically:
```bash
# 1. Use Node.js + Python Docker image
# 2. Install Python dependencies: pip3 install -r requirements.txt  
# 3. Install Node.js dependencies: npm ci
# 4. Build application: npm run build
# 5. Start: npm run start:prod
```

# Deploy
railway up
```

### Option 3: GitHub Integration

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Configure environment variables
6. Deploy!

## ⚙️ Environment Variables

### Required Variables

```env
NODE_ENV=production
USE_AI_PARAPHRASE=false
USE_ADVANCED_PARAPHRASE=true
```

### Optional Variables

```env
# CORS Configuration
ALLOWED_ORIGINS=https://your-frontend.com,https://another-domain.com
```

### Railway Automatic Variables

Railway automatically provides:

- `PORT` - The port your app should listen on
- `RAILWAY_PUBLIC_DOMAIN` - Your app's public domain
- `RAILWAY_PRIVATE_DOMAIN` - Private Railway domain

## 📋 Pre-deployment Checklist

- [ ] Remove or disable AI paraphrasing for basic deployment
- [ ] Ensure all dependencies are in `package.json`
- [ ] Test health check endpoint locally
- [ ] Configure CORS for your frontend domains
- [ ] Set up proper error handling
- [ ] Test API endpoints locally

## 🔧 Configuration Files

### railway.toml

```toml
version: 2
build:
  commands:
    - npm ci
    - npm run build
deploy:
  startCommand: npm run start:prod
  healthcheckPath: /paraphrase/health
  healthcheckTimeout: 300
```

### Procfile

```
web: npm run start:prod
```

## 🚀 Post-deployment Steps

1. **Test your deployment:**

   ```bash
   curl https://your-app.railway.app/paraphrase/health
   ```

2. **Test paraphrasing:**

   ```bash
   curl -X POST https://your-app.railway.app/paraphrase \
     -H "Content-Type: application/json" \
     -d '{"text": "Hello world", "style": "simple"}'
   ```

3. **Check API documentation:**
   Visit: `https://your-app.railway.app/api-docs`

## 📊 Monitoring

### Health Check

- Endpoint: `/paraphrase/health`
- Shows service status and available features
- Used by Railway for health monitoring

### Logs

View logs in Railway dashboard or via CLI:

```bash
railway logs
```

## 🔄 Updates and Redeployment

### Automatic Deployment

- Push to main branch triggers automatic deployment
- Railway monitors your GitHub repository

### Manual Deployment

```bash
railway up
```

## 🎯 Production Optimization

### Performance

- Health checks ensure service availability
- Graceful error handling with fallback strategies
- Rate limiting to prevent abuse
- Compression for faster responses

### Security

- CORS configured for specific domains
- Helmet.js for security headers
- Input validation and sanitization
- No sensitive data in logs

## 🆘 Troubleshooting

### Common Issues

1. **Build fails:**
   - Check Node.js version compatibility
   - Ensure all dependencies are listed in `package.json`
   - Check build logs in Railway dashboard

2. **App crashes on startup:**
   - Check logs for error messages
   - Verify environment variables
   - Test locally with production build

3. **Health check fails:**
   - Ensure app listens on `0.0.0.0:$PORT`
   - Check health endpoint returns 200 status
   - Verify no blocking operations in startup

4. **API not accessible:**
   - Check CORS configuration
   - Verify Railway domain is correct
   - Test with curl or Postman

### Getting Help

- Railway Community Discord
- Railway Documentation: https://docs.railway.app
- GitHub Issues on this repository

## 🚀 Advanced Features (Optional)

### AI Paraphrasing Setup

For AI features, you'll need additional setup:

1. **Enable Python runtime:**

   ```toml
   # In railway.toml
   [build]
   buildCommand = "./setup-ai.sh && npm ci && npm run build"
   ```

2. **Set environment variable:**

   ```env
   USE_AI_PARAPHRASE=true
   ```

3. **Note:** AI features require more memory and longer startup times.

### Custom Domain

1. Go to Railway dashboard
2. Select your service
3. Go to Settings > Domains
4. Add your custom domain
5. Update CORS settings to include your domain

## 📈 Scaling

Railway automatically scales based on:

- CPU usage
- Memory usage
- Request volume

For high-traffic applications:

- Monitor resource usage
- Consider upgrading Railway plan
- Implement caching strategies
- Use CDN for static assets
