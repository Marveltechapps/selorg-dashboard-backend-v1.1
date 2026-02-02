
const express = require('express');
const router = express.Router();
const communicationController = require('../controllers/communicationController');

// Communication endpoints
router.get('/chats', communicationController.listActiveChats);
router.get('/chats/:id', communicationController.getChatDetails);
router.post('/chats/:id/messages', communicationController.sendMessage);
router.put('/chats/:id/read', communicationController.markChatAsRead);
router.post('/broadcasts', communicationController.createBroadcast);
router.post('/chats/:id/flag', communicationController.flagIssue);

module.exports = router;
