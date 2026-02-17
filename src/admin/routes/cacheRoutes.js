/**
 * Admin cache stats endpoint.
 * GET /api/v1/admin/cache/stats - returns Redis connection and key/memory stats.
 * Secure this route with admin auth in production.
 */
const express = require('express');
const cacheService = require('../../core/services/cache.service');

const router = express.Router();

router.get('/stats', async (req, res, next) => {
  try {
    const stats = await cacheService.getStats();
    res.json({
      success: true,
      cache: {
        connected: stats.connected,
        keysCount: stats.keysCount ?? 0,
        memoryUsed: stats.memoryUsed ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
