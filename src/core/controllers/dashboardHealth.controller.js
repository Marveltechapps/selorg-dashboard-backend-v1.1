/**
 * Dashboard health check controller
 * Returns a simple liveness/health payload for each dashboard (admin, warehouse, production, darkstore).
 * Use for load balancers, monitoring, or frontend health checks.
 */

/**
 * Returns a health check handler for the given dashboard name.
 * @param {string} dashboardName - One of: 'admin', 'warehouse', 'production', 'darkstore'
 * @returns {function} Express request handler
 */
const dashboardHealth = (dashboardName) => (req, res) => {
  res.status(200).json({
    status: 'healthy',
    dashboard: dashboardName,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'selorg-backend',
    version: process.env.API_VERSION || '1.0.0',
  });
};

module.exports = {
  dashboardHealth,
};
