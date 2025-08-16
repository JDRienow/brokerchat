# Rate Limiting System

This document describes the production-ready rate limiting system implemented in the AI Chatbot application.

## 🏗️ **Architecture Overview**

### **Components**

1. **Redis-Based Rate Limiting** (`lib/rate-limit-redis.ts`)
   - Persistent storage across server restarts
   - Works with multiple server instances
   - Sliding window rate limiting
   - Automatic cleanup of expired entries

2. **Configuration System** (`lib/rate-limit-config.ts`)
   - Tier-based rate limits
   - User type differentiation
   - Configurable limits per subscription plan

3. **Daily Message Limits**
   - Per-user daily message tracking
   - Automatic reset at midnight UTC
   - Integration with user entitlements

## 🚀 **Deployment Requirements**

### **1. Redis Setup**

#### **Option A: Vercel KV (Recommended)**
```bash
# Install Vercel KV
npm install @vercel/kv

# Add to your .env.local
KV_URL=your-kv-url
KV_REST_API_URL=your-kv-rest-api-url
KV_REST_API_TOKEN=your-kv-rest-api-token
KV_REST_API_READ_ONLY_TOKEN=your-kv-read-only-token
```

#### **Option B: Upstash Redis**
```bash
# Add to your .env.local
REDIS_URL=redis://username:password@host:port
```

#### **Option C: Self-Hosted Redis**
```bash
# Install Redis
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Add to your .env.local
REDIS_URL=redis://localhost:6379
```

### **2. Environment Variables**

```bash
# Required for production
REDIS_URL=redis://username:password@host:port

# Optional fallback configuration
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

## 📊 **Rate Limit Tiers**

### **Guest Users (Broker Clients)**
- **Chat**: 20 messages per minute
- **Upload**: 1 upload per minute
- **API**: 30 requests per minute
- **Daily Messages**: 50 per day

> **Note**: These are broker clients accessing documents via public links. The higher limits allow them to have meaningful conversations about the documents while still preventing abuse.

### **Free Trial Users**
- **Chat**: 20 messages per minute
- **Upload**: 3 uploads per minute
- **API**: 50 requests per minute
- **Daily Messages**: 50 per day

### **Individual Plan**
- **Chat**: 50 messages per minute
- **Upload**: 10 uploads per minute
- **API**: 100 requests per minute
- **Daily Messages**: 200 per day

### **Team Plan**
- **Chat**: 100 messages per minute
- **Upload**: 20 uploads per minute
- **API**: 200 requests per minute
- **Daily Messages**: 500 per day

### **Enterprise Plan**
- **Chat**: 200 messages per minute
- **Upload**: 50 uploads per minute
- **API**: 500 requests per minute
- **Daily Messages**: 1000 per day

## 🔧 **Implementation Details**

### **Rate Limiting Headers**

All rate-limited endpoints return the following headers:

```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 23
X-RateLimit-Reset: 1640995200
Retry-After: 60
```

### **Error Responses**

When rate limits are exceeded:

```json
{
  "error": "Too many requests",
  "retryAfter": 60
}
```

### **Daily Message Limit Responses**

```json
{
  "error": "Daily message limit exceeded",
  "remaining": 0
}
```

## 📈 **Monitoring & Analytics**

### **Redis Metrics to Monitor**

1. **Memory Usage**
   ```bash
   redis-cli info memory
   ```

2. **Rate Limit Keys**
   ```bash
   redis-cli keys "*rate_limit*"
   ```

3. **Daily Message Counters**
   ```bash
   redis-cli keys "*daily_messages*"
   ```

### **Application Metrics**

Monitor these metrics in your application:

1. **Rate Limit Hits**: Number of 429 responses
2. **Daily Limit Hits**: Number of daily message limit exceeded
3. **Redis Connection Errors**: Failed Redis connections
4. **Fallback Usage**: When Redis is unavailable

### **Logging**

The system logs the following events:

```typescript
// Rate limit exceeded
console.error('Rate limit exceeded for user:', userId);

// Redis connection errors
console.error('Failed to connect to Redis:', error);

// Daily limit exceeded
console.error('Daily message limit exceeded for user:', userId);
```

## 🛡️ **Security Considerations**

### **1. IP Spoofing Protection**
- Uses `X-Forwarded-For` header with fallback
- Validates IP addresses
- Considers user agent for auth endpoints

### **2. User-Based Limiting**
- Authenticated users are limited by user ID
- Prevents IP-based workarounds
- Tied to subscription tiers

### **3. Graceful Degradation**
- Falls back to in-memory limiting if Redis unavailable
- Continues to function during Redis outages
- Logs all fallback events

## 🔄 **Migration from In-Memory**

### **Step 1: Deploy Redis**
1. Set up Redis instance
2. Add `REDIS_URL` to environment variables
3. Test connection

### **Step 2: Update Code**
1. Replace `lib/rate-limit` imports with `lib/rate-limit-redis`
2. Update API endpoints to use async rate limiters
3. Add daily message limit checks

### **Step 3: Test**
1. Verify rate limiting works with Redis
2. Test fallback behavior
3. Monitor performance

### **Step 4: Monitor**
1. Set up Redis monitoring
2. Track rate limit metrics
3. Adjust limits based on usage

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Redis Connection Failed**
   - Check `REDIS_URL` format
   - Verify network connectivity
   - Check Redis server status

2. **Rate Limits Not Working**
   - Verify Redis is connected
   - Check rate limit configuration
   - Review application logs

3. **High Memory Usage**
   - Monitor Redis memory usage
   - Check for memory leaks
   - Adjust key expiration times

### **Debug Commands**

```bash
# Check Redis connection
redis-cli ping

# Monitor Redis commands
redis-cli monitor

# Check specific rate limit key
redis-cli get "user:123:60000"

# Clear all rate limit keys (emergency only)
redis-cli keys "*rate_limit*" | xargs redis-cli del
```

## 📋 **Configuration Checklist**

- [ ] Redis instance deployed and accessible
- [ ] `REDIS_URL` environment variable set
- [ ] Rate limiting code deployed
- [ ] Daily message limits implemented
- [ ] Monitoring and alerting configured
- [ ] Fallback behavior tested
- [ ] Performance impact assessed
- [ ] Documentation updated

## 🔮 **Future Enhancements**

1. **Geographic Rate Limiting**
   - Different limits by country/region
   - IP geolocation integration

2. **Behavioral Rate Limiting**
   - Detect and limit suspicious patterns
   - Machine learning-based limits

3. **Dynamic Rate Limiting**
   - Adjust limits based on server load
   - Time-based limit variations

4. **Rate Limit Analytics**
   - Detailed usage analytics
   - Predictive limit adjustments 