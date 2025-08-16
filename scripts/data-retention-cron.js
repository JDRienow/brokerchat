#!/usr/bin/env node

/**
 * Data Retention Cron Job
 *
 * This script runs data retention cleanup automatically.
 * It can be scheduled to run daily using a cron job or GitHub Actions.
 *
 * Usage:
 *   node scripts/data-retention-cron.js
 *   node scripts/data-retention-cron.js --dry-run
 *   node scripts/data-retention-cron.js --stats-only
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const https = require('node:https');
const http = require('node:http');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: jsonData,
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: data,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Get storage statistics
async function getStorageStats() {
  try {
    console.log('📊 Getting storage statistics...');

    // Create Basic auth header
    const credentials = Buffer.from(
      `${ADMIN_EMAIL}:${ADMIN_PASSWORD}`,
    ).toString('base64');

    const response = await makeRequest(`${BASE_URL}/api/admin/data-retention`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credentials}`,
      },
    });

    if (response.statusCode !== 200) {
      throw new Error(`Failed to get stats: ${response.statusCode}`);
    }

    return response.data;
  } catch (error) {
    console.error('❌ Error getting storage stats:', error.message);
    throw error;
  }
}

// Run data retention cleanup
async function runCleanup() {
  try {
    console.log('🧹 Running data retention cleanup...');

    // Create Basic auth header
    const credentials = Buffer.from(
      `${ADMIN_EMAIL}:${ADMIN_PASSWORD}`,
    ).toString('base64');

    const response = await makeRequest(`${BASE_URL}/api/admin/data-retention`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credentials}`,
      },
    });

    if (response.statusCode !== 200) {
      throw new Error(`Failed to run cleanup: ${response.statusCode}`);
    }

    return response.data;
  } catch (error) {
    console.error('❌ Error running cleanup:', error.message);
    throw error;
  }
}

// Format bytes to human readable format
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Generate cleanup report
function generateReport(stats, config, cleanupResults = null) {
  const report = {
    timestamp: new Date().toISOString(),
    storageStats: {
      documents: {
        count: stats.documents.count,
        totalSize: formatBytes(stats.documents.totalSizeMB * 1024 * 1024),
        oldestDocument: stats.documents.oldestDocument
          ? new Date(stats.documents.oldestDocument).toISOString()
          : 'N/A',
      },
      chatHistories: {
        count: stats.chatHistories.count,
      },
      clientSessions: {
        count: stats.clientSessions.count,
      },
      analytics: {
        count: stats.analytics.count,
      },
      estimatedStorage: formatBytes(stats.estimatedStorageMB * 1024 * 1024),
    },
    retentionConfig: config,
    cleanupResults: cleanupResults,
  };

  return report;
}

// Print report to console
function printReport(report) {
  console.log(`\n${'='.repeat(80)}`);
  console.log('📋 DATA RETENTION REPORT');
  console.log(`${'='.repeat(80)}`);
  console.log(`⏰ Generated: ${report.timestamp}`);

  console.log('\n📊 STORAGE STATISTICS:');
  console.log(
    `   Documents: ${report.storageStats.documents.count} (${report.storageStats.documents.totalSize})`,
  );
  console.log(`   Chat Histories: ${report.storageStats.chatHistories.count}`);
  console.log(
    `   Client Sessions: ${report.storageStats.clientSessions.count}`,
  );
  console.log(`   Analytics: ${report.storageStats.analytics.count}`);
  console.log(
    `   Estimated Total Storage: ${report.storageStats.estimatedStorage}`,
  );

  if (report.storageStats.documents.oldestDocument !== 'N/A') {
    console.log(
      `   Oldest Document: ${report.storageStats.documents.oldestDocument}`,
    );
  }

  console.log('\n⚙️  RETENTION CONFIGURATION:');
  console.log(
    `   Documents: ${report.retentionConfig.documents.daysToKeep} days`,
  );
  console.log(
    `   Chat Histories: ${report.retentionConfig.chatHistories.daysToKeep} days`,
  );
  console.log(
    `   Client Sessions: ${report.retentionConfig.clientSessions.daysToKeep} days`,
  );
  console.log(
    `   Analytics: ${report.retentionConfig.analytics.daysToKeep} days`,
  );
  console.log(
    `   Error Logs: ${report.retentionConfig.errorLogs.daysToKeep} days`,
  );

  if (report.cleanupResults) {
    console.log('\n🧹 CLEANUP RESULTS:');
    console.log(
      `   Total Records Deleted: ${report.cleanupResults.totalDeleted}`,
    );
    console.log(
      `   Documents Deleted: ${report.cleanupResults.results.documents.deletedCount || 0}`,
    );
    console.log(
      `   Chat Histories Deleted: ${report.cleanupResults.results.chatHistories.deletedCount || 0}`,
    );
    console.log(
      `   Client Sessions Deleted: ${report.cleanupResults.results.clientSessions.deletedCount || 0}`,
    );
    console.log(
      `   Analytics Deleted: ${report.cleanupResults.results.analytics.deletedCount || 0}`,
    );
    console.log(
      `   Error Logs Deleted: ${report.cleanupResults.results.errorLogs.deletedCount || 0}`,
    );
  }

  console.log(`\n${'='.repeat(80)}`);
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isStatsOnly = args.includes('--stats-only');

  console.log('🚀 Starting Data Retention Cron Job');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`⏰ Time: ${new Date().toISOString()}`);

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No actual cleanup will be performed');
  }

  if (isStatsOnly) {
    console.log('📊 STATS ONLY MODE - Only collecting statistics');
  }

  try {
    // Get storage statistics
    const statsData = await getStorageStats();
    const report = generateReport(statsData.stats, statsData.config);

    // Print initial report
    printReport(report);

    // If stats only, exit here
    if (isStatsOnly) {
      console.log('✅ Stats collection completed');
      process.exit(0);
    }

    // If dry run, exit here
    if (isDryRun) {
      console.log('✅ Dry run completed - no cleanup performed');
      process.exit(0);
    }

    // Run actual cleanup
    console.log('\n🧹 Running actual cleanup...');
    const cleanupData = await runCleanup();

    // Update report with cleanup results
    const finalReport = generateReport(
      statsData.stats,
      statsData.config,
      cleanupData,
    );

    // Print final report
    printReport(finalReport);

    // Exit with appropriate code
    if (cleanupData.success) {
      console.log('✅ Data retention cleanup completed successfully');
      process.exit(0);
    } else {
      console.log('⚠️  Data retention cleanup completed with errors');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Data retention cron job failed:', error.message);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Data Retention Cron Job

Usage:
  node scripts/data-retention-cron.js [options]

Options:
  --dry-run        Show what would be deleted without actually deleting
  --stats-only     Only collect and display storage statistics
  --help, -h       Show this help message

Environment Variables:
  BASE_URL         Base URL for the application (default: http://localhost:3000)
  ADMIN_EMAIL      Admin email for authentication
  ADMIN_PASSWORD   Admin password for authentication

Examples:
  node scripts/data-retention-cron.js
  node scripts/data-retention-cron.js --dry-run
  node scripts/data-retention-cron.js --stats-only
  BASE_URL=https://myapp.vercel.app node scripts/data-retention-cron.js
  `);
  process.exit(0);
}

// Run the main function
main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
