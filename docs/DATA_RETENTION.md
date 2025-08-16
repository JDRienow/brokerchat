# Data Retention System

This document describes the data retention system implemented in the AI Chatbot application to manage storage costs and maintain performance.

## 🎯 **Overview**

The data retention system automatically cleans up old data to:
- **Reduce storage costs** on Supabase Pro plan (8GB database, 100GB storage)
- **Maintain performance** by keeping database size manageable
- **Comply with data privacy** by automatically removing old data
- **Provide predictable costs** by preventing unlimited data growth

## 📊 **Default Retention Periods**

| Data Type | Retention Period | Rationale |
|-----------|------------------|-----------|
| **Documents** | 30 days | Documents become stale, clients need recent info |
| **Chat Histories** | 7 days | Recent conversations are most relevant |
| **Client Sessions** | 90 days | Keep email captures for lead generation |
| **Analytics** | 365 days | Long-term trend analysis |
| **Error Logs** | 30 days | Debug recent issues only |

## ⚙️ **Configuration**

### Environment Variables

You can customize retention periods using environment variables:

```bash
# Data retention settings (in days)
DOCUMENT_RETENTION_DAYS=30      # Documents are deleted after 30 days
CHAT_RETENTION_DAYS=7          # Chat histories are deleted after 7 days
SESSION_RETENTION_DAYS=90      # Client sessions are deleted after 90 days
ANALYTICS_RETENTION_DAYS=365   # Analytics are deleted after 1 year
ERROR_LOG_RETENTION_DAYS=30    # Error logs are deleted after 30 days
```

### Business Impact

**For Broker Clients:**
- ✅ Can see last 7 days of chat history
- ✅ Recent documents remain accessible
- ✅ Email captures kept for 90 days (lead generation)
- ✅ Analytics available for 1 year (trend analysis)

**For Brokers:**
- ✅ Reduced storage costs
- ✅ Better performance
- ✅ Automatic cleanup (no manual work)
- ✅ Predictable monthly costs

## 🚀 **Implementation**

### 1. Core Functions (`lib/data-retention.ts`)

```typescript
// Clean up old documents and their chunks
await cleanupOldDocuments();

// Clean up old chat histories
await cleanupOldChatHistories();

// Clean up old client sessions
await cleanupOldClientSessions();

// Clean up old analytics
await cleanupOldAnalytics();

// Clean up old error logs
await cleanupOldErrorLogs();

// Run all cleanup operations
await runDataRetentionCleanup();
```

### 2. API Endpoints

**Get Storage Statistics:**
```bash
GET /api/admin/data-retention
```

**Run Cleanup:**
```bash
POST /api/admin/data-retention
```

### 3. Cron Job Script

```bash
# Run cleanup
node scripts/data-retention-cron.js

# Dry run (see what would be deleted)
node scripts/data-retention-cron.js --dry-run

# Stats only (no cleanup)
node scripts/data-retention-cron.js --stats-only
```

## 🔄 **Automated Cleanup**

### GitHub Actions Workflow

The system includes a GitHub Actions workflow that runs daily at 2 AM UTC:

```yaml
# .github/workflows/data-retention.yml
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:     # Manual trigger
```

### Required Secrets

Set these secrets in your GitHub repository:

```bash
BASE_URL=https://your-app.vercel.app
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-admin-password
SLACK_WEBHOOK=https://hooks.slack.com/...  # Optional
```

## 📈 **Storage Monitoring**

### Storage Statistics

The system provides detailed storage statistics:

```json
{
  "documents": {
    "count": 150,
    "totalSizeMB": 45.2,
    "oldestDocument": "2024-01-15T10:30:00Z"
  },
  "chatHistories": {
    "count": 1250
  },
  "clientSessions": {
    "count": 89
  },
  "analytics": {
    "count": 5670
  },
  "estimatedStorageMB": 52.8
}
```

### Monitoring Dashboard

You can monitor storage usage by calling the API:

```bash
curl -X GET https://your-app.vercel.app/api/admin/data-retention
```

## 🛡️ **Safety Features**

### 1. Dry Run Mode

Test cleanup without actually deleting data:

```bash
node scripts/data-retention-cron.js --dry-run
```

### 2. Granular Cleanup

Each data type is cleaned up separately, so if one fails, others still succeed.

### 3. Error Handling

- Failed deletions are logged but don't stop the process
- Storage errors are handled gracefully
- Database errors are caught and reported

### 4. Backup Strategy

Before implementing data retention, ensure you have:
- Database backups enabled in Supabase
- Point-in-time recovery configured
- Export functionality for critical data

## 📋 **Cleanup Process**

### Document Cleanup

1. **Find old documents** (older than retention period)
2. **Delete document chunks** (vector embeddings)
3. **Delete public links** (associated with documents)
4. **Delete client sessions** (for these documents)
5. **Delete chat histories** (for these documents)
6. **Delete files from storage** (Supabase Storage)
7. **Delete document metadata** (final step)

### Chat History Cleanup

1. **Find old chat histories** (older than 7 days)
2. **Delete chat history records** (messages, metadata)

### Client Session Cleanup

1. **Find old client sessions** (older than 90 days)
2. **Delete session records** (email captures, session data)

## 🔧 **Customization**

### Adjusting Retention Periods

For different business needs, you can adjust retention periods:

```bash
# Keep documents longer for compliance
DOCUMENT_RETENTION_DAYS=90

# Keep chat histories longer for support
CHAT_RETENTION_DAYS=30

# Keep sessions shorter for privacy
SESSION_RETENTION_DAYS=30
```

### Adding New Data Types

To add retention for new data types:

1. **Add to configuration:**
```typescript
export interface RetentionConfig {
  // ... existing types
  newDataType: {
    daysToKeep: number;
    description: string;
  };
}
```

2. **Add cleanup function:**
```typescript
export async function cleanupOldNewDataType() {
  // Implementation
}
```

3. **Add to main cleanup:**
```typescript
export async function runDataRetentionCleanup() {
  const results = {
    // ... existing cleanups
    newDataType: await cleanupOldNewDataType(),
  };
}
```

## 📊 **Cost Analysis**

### Supabase Pro Plan Limits

- **Database**: 8GB storage
- **Storage**: 100GB file storage
- **Bandwidth**: 250GB/month

### Estimated Storage Growth

**Per Document:**
- Document chunks: ~1-5MB (depending on size)
- Chat histories: ~0.01MB per message
- Client sessions: ~0.005MB per session
- Analytics: ~0.002MB per event

**Monthly Growth (100 active brokers):**
- Documents: ~500MB/month
- Chat histories: ~50MB/month
- Client sessions: ~10MB/month
- Analytics: ~5MB/month
- **Total**: ~565MB/month

**Without Retention:**
- 1 year: ~6.8GB
- 2 years: ~13.6GB (exceeds 8GB limit)

**With Retention:**
- Documents: 30 days = ~500MB
- Chat histories: 7 days = ~12MB
- Client sessions: 90 days = ~30MB
- Analytics: 365 days = ~2.4GB
- **Total**: ~3GB (well within limits)

## 🚨 **Troubleshooting**

### Common Issues

1. **Cleanup fails with authentication error**
   - Check admin credentials in environment variables
   - Verify API endpoint is accessible

2. **Storage not decreasing after cleanup**
   - Check if files are being deleted from Supabase Storage
   - Verify database constraints aren't preventing deletion

3. **Cleanup takes too long**
   - Consider running cleanup more frequently
   - Add database indexes for better performance

### Monitoring

Monitor these metrics:
- Cleanup success rate
- Storage usage over time
- Cleanup duration
- Error rates

## 📞 **Support**

For issues with data retention:

1. Check the logs in GitHub Actions
2. Run the dry-run script to see what would be deleted
3. Check storage statistics via the API
4. Contact support if cleanup is failing

## 🔄 **Migration Guide**

### From No Retention to Retention

1. **Backup your data** (if needed)
2. **Set retention periods** in environment variables
3. **Test with dry-run** mode
4. **Run cleanup manually** first
5. **Enable automated cleanup** via GitHub Actions

### Adjusting Existing Retention

1. **Update environment variables**
2. **Test with dry-run** mode
3. **Monitor results** for a few days
4. **Adjust as needed**

---

**Note**: This system is designed to be safe and reversible. Always test with dry-run mode before running actual cleanup in production. 