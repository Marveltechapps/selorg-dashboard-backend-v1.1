const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { authenticateToken } = require('../../core/middleware');

/**
 * Global Search Routes
 * Search across all modules: orders, products, users, vendors, riders, etc.
 */

// GET /api/v1/shared/search - Global unified search
router.get('/', authenticateToken, searchController.globalSearch);

// GET /api/v1/shared/search/suggestions - Get search suggestions
router.get('/suggestions', authenticateToken, searchController.getSuggestions);

// GET /api/v1/shared/search/recent - Get recent searches
router.get('/recent', authenticateToken, searchController.getRecentSearches);

module.exports = router;
