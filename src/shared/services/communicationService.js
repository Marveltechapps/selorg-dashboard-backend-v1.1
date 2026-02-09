
const Chat = require('../../common-models/Chat');
const Message = require('../../common-models/Message');
const Broadcast = require('../../common-models/Broadcast');
const logger = require('../../core/utils/logger');

/**
 * List active chats
 */
const listActiveChats = async (filters = {}) => {
  try {
    const { unreadOnly = false } = filters;

    const query = {};
    if (unreadOnly) {
      query.unreadCount = { $gt: 0 };
    }

    const chats = await Chat.find(query)
      .sort({ lastMessageTime: -1 })
      .lean();

    // Calculate actual unread count from messages for each chat
    const chatsWithUnreadCount = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chatId: chat.id,
          read: false,
        });
        return {
          ...chat,
          unreadCount,
        };
      })
    );

    // Filter by unreadOnly if needed (after calculating actual counts)
    const filteredChats = unreadOnly
      ? chatsWithUnreadCount.filter(chat => chat.unreadCount > 0)
      : chatsWithUnreadCount;

    return { chats: filteredChats };
  } catch (error) {
    logger.error('Error listing active chats:', error);
    throw error;
  }
};

/**
 * Get chat details
 */
const getChatDetails = async (chatId, options = {}) => {
  try {
    const { limit = 50, before } = options;

    // Fetch chat and messages in parallel for better performance
    const [chat, messages] = await Promise.all([
      Chat.findOne({ id: chatId }).lean(),
      (async () => {
        const messageQuery = { chatId };
        if (before) {
          messageQuery.createdAt = { $lt: new Date(before) };
        }

        const msgs = await Message.find(messageQuery)
          .sort({ createdAt: -1 })
          .limit(limit)
          .select('id chatId senderId senderName content direction read createdAt')
          .lean();
        
        // Reverse to get chronological order (oldest first)
        msgs.reverse();

        // Add timestamp field for frontend compatibility
        return msgs.map(msg => ({
          ...msg,
          timestamp: msg.createdAt || msg.timestamp,
        }));
      })()
    ]);

    if (!chat) {
      throw new Error('Chat not found');
    }

    return {
      ...chat,
      messages,
    };
  } catch (error) {
    logger.error('Error getting chat details:', error);
    throw error;
  }
};

/**
 * Get chat messages
 */
const getChatMessages = async (chatId, options = {}) => {
  try {
    const { limit = 50, before } = options;

    const messageQuery = { chatId };
    if (before) {
      messageQuery.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(messageQuery)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = messages.length > limit;
    const result = hasMore ? messages.slice(0, limit).reverse() : messages.reverse();

    return {
      messages: result,
      hasMore,
    };
  } catch (error) {
    logger.error('Error getting chat messages:', error);
    throw error;
  }
};

/**
 * Send message
 */
const sendMessage = async (chatId, messageData) => {
  try {
    // Check MongoDB connection state
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database connection not ready. Please wait a moment and try again.');
    }

    // Validate input
    if (!messageData || !messageData.content || typeof messageData.content !== 'string' || !messageData.content.trim()) {
      throw new Error('Message content is required');
    }

    const chat = await Chat.findOne({ id: chatId });
    if (!chat) {
      throw new Error('Chat not found');
    }

    const message = new Message({
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      chatId,
      senderId: 'dispatch-1', // In real app, get from auth
      senderName: 'Dispatch',
      content: messageData.content.trim(),
      direction: 'outgoing',
      read: false,
    });

    await message.save();
    logger.info('[communicationService.sendMessage] message saved', { chatId, messageId: message.id });

    // Update chat metadata
    chat.lastMessage = messageData.content.trim();
    chat.lastMessageTime = new Date();
    chat.updatedAt = new Date();
    await chat.save();

    const messageObj = message.toObject ? message.toObject() : message;
    // Add timestamp field for frontend compatibility
    messageObj.timestamp = messageObj.createdAt || messageObj.timestamp || new Date().toISOString();
    
    return messageObj;
  } catch (error) {
    logger.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Mark chat as read
 */
const markChatAsRead = async (chatId) => {
  try {
    const chat = await Chat.findOne({ id: chatId });
    if (!chat) {
      throw new Error('Chat not found');
    }

    await Message.updateMany(
      { chatId, read: false },
      { $set: { read: true } }
    );

    chat.unreadCount = 0;
    await chat.save();

    return { message: 'Chat marked as read' };
  } catch (error) {
    logger.error('Error marking chat as read:', error);
    throw error;
  }
};

/**
 * Create broadcast
 */
const createBroadcast = async (broadcastData) => {
  try {
    const broadcastId = `broadcast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Use findOneAndUpdate with upsert to avoid collection creation issues
    // Reusing 'messages' collection which already exists
    const broadcastDoc = {
      id: broadcastId,
      documentType: 'broadcast', // Distinguish broadcasts from regular messages
      message: broadcastData.message,
      recipients: broadcastData.recipients,
      priority: broadcastData.priority || 'normal',
      status: 'sent', // Mark as sent immediately
      sentCount: broadcastData.recipients.length,
      failedCount: 0,
    };

    // Use findOneAndUpdate with upsert to avoid collection creation issues
    // Query by both id and documentType to ensure we're working with broadcasts
    const broadcast = await Broadcast.findOneAndUpdate(
      { id: broadcastId, documentType: 'broadcast' },
      { $set: broadcastDoc },
      { upsert: true, new: true, runValidators: false }
    );

    if (!broadcast) {
      throw new Error('Failed to create broadcast');
    }

    return broadcast.toObject ? broadcast.toObject() : broadcast;
  } catch (error) {
    logger.error('Error creating broadcast:', error);
    // If it's a collection limit error, provide a more helpful message
    if (error.message && (error.message.includes('500 collections') || error.message.includes('cannot create a new collection'))) {
      throw new Error('Database collection limit reached. Please delete unused collections or upgrade your MongoDB Atlas plan.');
    }
    throw error;
  }
};

/**
 * Flag issue
 */
const flagIssue = async (chatId, flagData) => {
  try {
    const chat = await Chat.findOne({ id: chatId });
    if (!chat) {
      throw new Error('Chat not found');
    }

    const issueId = `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    // In a real implementation, this would create an issue record
    // For now, just return success

    return {
      message: 'Issue flagged successfully',
      issueId,
    };
  } catch (error) {
    logger.error('Error flagging issue:', error);
    throw error;
  }
};

module.exports = {
  listActiveChats,
  getChatDetails,
  getChatMessages,
  sendMessage,
  markChatAsRead,
  createBroadcast,
  flagIssue,
};
