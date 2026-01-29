const express = require('express');
const router = express.Router();
const storeWarehouseController = require('../controllers/storeWarehouseController');
const { authenticateToken } = require('../../core/middleware');

// Stores
router.get('/stores', authenticateToken, storeWarehouseController.listStores);
router.get('/stores/:id', authenticateToken, storeWarehouseController.getStore);
router.post('/stores', authenticateToken, storeWarehouseController.createStore);
router.put('/stores/:id', authenticateToken, storeWarehouseController.updateStore);
router.delete('/stores/:id', authenticateToken, storeWarehouseController.deleteStore);

// Warehouses
router.get('/warehouses', authenticateToken, storeWarehouseController.listWarehouses);

// Staff
router.get('/staff', authenticateToken, storeWarehouseController.listStaff);
router.get('/staff/:id', authenticateToken, storeWarehouseController.getStaff);
router.post('/staff', authenticateToken, storeWarehouseController.createStaff);
router.put('/staff/:id', authenticateToken, storeWarehouseController.updateStaff);
router.delete('/staff/:id', authenticateToken, storeWarehouseController.deleteStaff);

// Performance & Stats
router.get('/stores/performance', authenticateToken, storeWarehouseController.getStorePerformance);
router.get('/stores/stats', authenticateToken, storeWarehouseController.getStoreStats);

module.exports = router;
