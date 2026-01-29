const AuditLog = require('../../common-models/AuditLog');
const { asyncHandler } = require('../../core/middleware');

const auditLogsController = {
  listLogs: asyncHandler(async (req, res) => {
    const { module, action, severity, userId, startDate, endDate, page = 1, limit = 50 } = req.query;
    const query = {};
    
    if (module) query.module = module;
    if (action) query.action = action;
    if (severity) query.severity = severity;
    if (userId) query.userId = userId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean()
      .populate('userId', 'name email');

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      data: logs,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      }
    });
  }),

  getLog: asyncHandler(async (req, res) => {
    const log = await AuditLog.findById(req.params.id).lean().populate('userId', 'name email');
    if (!log) {
      return res.status(404).json({ success: false, message: 'Log not found' });
    }
    res.json({ success: true, data: log });
  }),

  getStats: asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalEvents, todayEvents, criticalEvents, uniqueUsers, topAction, topModule] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.countDocuments({ createdAt: { $gte: today } }),
      AuditLog.countDocuments({ severity: 'critical' }),
      AuditLog.distinct('userId').then(users => users.length),
      AuditLog.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]).then(result => result[0]?._id || 'N/A'),
      AuditLog.aggregate([
        { $group: { _id: '$module', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]).then(result => result[0]?._id || 'N/A'),
    ]);

    res.json({
      success: true,
      data: {
        totalEvents,
        todayEvents,
        criticalEvents,
        uniqueUsers,
        topAction,
        topModule,
      }
    });
  }),
};

module.exports = auditLogsController;
