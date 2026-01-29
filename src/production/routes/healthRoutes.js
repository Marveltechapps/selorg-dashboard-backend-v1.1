<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const {
  getHealthSummary,
  getChecklists,
  updateChecklistItem,
  submitChecklist,
  getEquipment,
  getIncidents,
  reportIncident,
  resolveIncident,
} = require('../controllers/healthController');

router.get('/summary', getHealthSummary);
router.get('/checklists', getChecklists);
router.put('/checklists/:checklistId/items/:itemId', updateChecklistItem);
router.post('/checklists/:checklistId/submit', submitChecklist);
router.get('/equipment', getEquipment);
router.get('/incidents', getIncidents);
router.post('/incidents', reportIncident);
router.put('/incidents/:incidentId/resolve', resolveIncident);

module.exports = router;

=======
const express = require('express');
const router = express.Router();
const {
  getHealthSummary,
  getChecklists,
  updateChecklistItem,
  submitChecklist,
  getEquipment,
  getIncidents,
  reportIncident,
  resolveIncident,
} = require('../controllers/healthController');

router.get('/summary', getHealthSummary);
router.get('/checklists', getChecklists);
router.put('/checklists/:checklistId/items/:itemId', updateChecklistItem);
router.post('/checklists/:checklistId/submit', submitChecklist);
router.get('/equipment', getEquipment);
router.get('/incidents', getIncidents);
router.post('/incidents', reportIncident);
router.put('/incidents/:incidentId/resolve', resolveIncident);

module.exports = router;

>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
