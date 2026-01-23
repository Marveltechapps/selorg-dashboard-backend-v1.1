/**
 * User test fixtures
 */

const sampleUsers = {
  admin: {
    userId: 'admin-user-id',
    email: 'admin@selorg.com',
    name: 'Admin User',
    role: 'admin',
    roleId: 'admin',
    permissions: ['*'],
  },
  darkstore: {
    userId: 'darkstore-user-id',
    email: 'darkstore@selorg.com',
    name: 'Darkstore User',
    role: 'darkstore',
    roleId: 'darkstore',
    permissions: ['darkstore:*'],
  },
  finance: {
    userId: 'finance-user-id',
    email: 'finance@selorg.com',
    name: 'Finance User',
    role: 'finance',
    roleId: 'finance',
    permissions: ['finance:*'],
  },
};

module.exports = {
  sampleUsers,
};