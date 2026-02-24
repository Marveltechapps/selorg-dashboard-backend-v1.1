const express = require('express');
const router = express.Router();
const storeWarehouseController = require('../controllers/storeWarehouseController');
const { authenticateToken, cacheMiddleware } = require('../../core/middleware');
const appConfig = require('../../config/app');

// Stores
router.get('/stores', authenticateToken, cacheMiddleware(appConfig.cache.admin.stores), storeWarehouseController.listStores);
router.get('/stores/:id', authenticateToken, cacheMiddleware(appConfig.cache.admin.stores), storeWarehouseController.getStore);
router.post('/stores', authenticateToken, storeWarehouseController.createStore);
router.put('/stores/:id', authenticateToken, storeWarehouseController.updateStore);
router.delete('/stores/:id', authenticateToken, storeWarehouseController.deleteStore);

// Warehouses
router.get('/warehouses', authenticateToken, cacheMiddleware(appConfig.cache.admin.stores), storeWarehouseController.listWarehouses);

// Staff
router.get('/staff', authenticateToken, cacheMiddleware(appConfig.cache.staff), storeWarehouseController.listStaff);
router.get('/staff/:id', authenticateToken, cacheMiddleware(appConfig.cache.staff), storeWarehouseController.getStaff);
router.post('/staff', authenticateToken, storeWarehouseController.createStaff);
router.put('/staff/:id', authenticateToken, storeWarehouseController.updateStaff);
router.delete('/staff/:id', authenticateToken, storeWarehouseController.deleteStaff);

// Performance & Stats
router.get('/stores/performance', authenticateToken, cacheMiddleware(appConfig.cache.admin.stores), storeWarehouseController.getStorePerformance);
router.get('/stores/stats', authenticateToken, cacheMiddleware(appConfig.cache.admin.stores), storeWarehouseController.getStoreStats);

module.exports = router;
