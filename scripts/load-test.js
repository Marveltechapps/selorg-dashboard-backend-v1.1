#!/usr/bin/env node
/**
 * Load Testing Script
 * Tests API performance under load using autocannon
 * 
 * Usage: node scripts/load-test.js [options]
 * Options:
 *   --url <url>        Base URL (default: http://localhost:5000)
 *   --connections <n>  Number of concurrent connections (default: 10)
 *   --duration <s>     Test duration in seconds (default: 30)
 *   --endpoint <path>  Specific endpoint to test (default: /health)
 */

const autocannon = require('autocannon');
const { program } = require('commander');

program
  .option('--url <url>', 'Base URL', 'http://localhost:5000')
  .option('--connections <n>', 'Number of concurrent connections', '10')
  .option('--duration <s>', 'Test duration in seconds', '30')
  .option('--endpoint <path>', 'Endpoint to test', '/health')
  .option('--method <method>', 'HTTP method', 'GET')
  .option('--body <json>', 'Request body (JSON string)')
  .parse();

const options = program.opts();

const config = {
  url: options.url,
  connections: parseInt(options.connections),
  duration: parseInt(options.duration),
  method: options.method,
  path: options.endpoint,
  headers: {
    'Content-Type': 'application/json',
  },
};

if (options.body) {
  config.body = options.body;
}

console.log('Starting load test...');
console.log('Configuration:', JSON.stringify(config, null, 2));
console.log('');

const instance = autocannon(config, (err, result) => {
  if (err) {
    console.error('Load test error:', err);
    process.exit(1);
  }

  console.log('\n=== Load Test Results ===\n');
  console.log('Requests:');
  console.log(`  Total: ${result.requests.total}`);
  console.log(`  Average: ${result.requests.average}/sec`);
  console.log(`  Min: ${result.requests.min}/sec`);
  console.log(`  Max: ${result.requests.max}/sec`);
  
  console.log('\nLatency:');
  console.log(`  Average: ${result.latency.average}ms`);
  console.log(`  Min: ${result.latency.min}ms`);
  console.log(`  Max: ${result.latency.max}ms`);
  console.log(`  p50: ${result.latency.p50}ms`);
  console.log(`  p90: ${result.latency.p90}ms`);
  console.log(`  p99: ${result.latency.p99}ms`);
  
  console.log('\nThroughput:');
  console.log(`  Average: ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/s`);
  console.log(`  Min: ${(result.throughput.min / 1024 / 1024).toFixed(2)} MB/s`);
  console.log(`  Max: ${(result.throughput.max / 1024 / 1024).toFixed(2)} MB/s`);
  
  console.log('\nErrors:');
  console.log(`  Total: ${result.errors}`);
  console.log(`  Rate: ${((result.errors / result.requests.total) * 100).toFixed(2)}%`);
  
  console.log('\nStatus Codes:');
  Object.entries(result.statusCodeStats).forEach(([code, count]) => {
    console.log(`  ${code}: ${count}`);
  });

  // Performance recommendations
  console.log('\n=== Performance Recommendations ===\n');
  
  if (result.latency.p99 > 1000) {
    console.log('⚠️  p99 latency > 1000ms - Consider optimizing slow endpoints');
  }
  
  if ((result.errors / result.requests.total) > 0.01) {
    console.log('⚠️  Error rate > 1% - Review error logs and fix issues');
  }
  
  if (result.throughput.average < 1000000) {
    console.log('⚠️  Low throughput - Consider adding caching or optimizing queries');
  }
  
  if (result.latency.p90 < 100 && result.errors === 0) {
    console.log('✅ Excellent performance!');
  }
});

// Handle process termination
process.on('SIGINT', () => {
  instance.stop();
  console.log('\nLoad test stopped');
  process.exit(0);
});
