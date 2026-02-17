const WarehouseEquipment = require('../models/WarehouseEquipment');
const EquipmentIssue = require('../models/EquipmentIssue');
const ErrorResponse = require("../../core/utils/ErrorResponse");

/**
 * @desc Equipment & Assets Service
 */
const equipmentService = {
  listDevices: async () => {
    const devices = await WarehouseEquipment.find({ type: 'hsd-device' }).sort({ id: 1 }).lean();
    // Transform to match frontend Device interface
    return devices.map(d => ({
      id: d.id,
      deviceId: d.id,
      user: d.operator || 'Unassigned',
      battery: d.battery || 85 + Math.floor(Math.random() * 15),
      signal: d.signal || (d.status === 'active' ? 'strong' : 'offline'),
      status: d.status === 'active' ? 'active' : d.status === 'charging' ? 'charging' : 'offline'
    }));
  },

  getDeviceById: async (id) => {
    const device = await WarehouseEquipment.findOne({ id, type: 'hsd-device' });
    if (!device) throw new ErrorResponse(`Device not found with id ${id}`, 404);
    return device;
  },

  listMachinery: async () => {
    const machinery = await WarehouseEquipment.find({ type: { $ne: 'hsd-device' } }).sort({ type: 1, id: 1 }).lean();
    // Transform to match frontend Equipment interface
    return machinery.map(m => ({
      id: m.id,
      equipmentId: m.id,
      name: m.name,
      type: m.type === 'forklift' ? 'forklift' : m.type === 'pallet-jack' ? 'pallet-jack' : 'crane',
      zone: m.zone,
      operator: m.operator,
      status: m.status === 'active' ? 'operational' : m.status === 'idle' ? 'idle' : 'maintenance',
      issue: m.issue
    }));
  },

  addEquipment: async (data) => {
    if (!data.id) {
      const count = await WarehouseEquipment.countDocuments();
      data.id = `EQP-${(count + 1).toString().padStart(3, '0')}`;
    }
    return await WarehouseEquipment.create(data);
  },

  getEquipmentById: async (id) => {
    const equipment = await WarehouseEquipment.findOne({ id });
    if (!equipment) throw new ErrorResponse(`Equipment not found with id ${id}`, 404);
    return equipment;
  },

  reportIssue: async (id, issueData) => {
    const equipment = await WarehouseEquipment.findOne({ id });
    if (!equipment) throw new ErrorResponse(`Equipment not found with id ${id}`, 404);
    
    equipment.status = 'maintenance';
    await equipment.save();

    const count = await EquipmentIssue.countDocuments();
    const issueId = `ISS-${(count + 1).toString().padStart(3, '0')}`;
    
    return await EquipmentIssue.create({
      id: issueId,
      equipmentId: id,
      reportedBy: issueData.reportedBy || 'System',
      description: issueData.description,
      severity: issueData.severity || 'medium',
      status: 'open'
    });
  },

  resolveIssue: async (id) => {
    const equipment = await WarehouseEquipment.findOne({ id });
    if (!equipment) throw new ErrorResponse(`Equipment not found with id ${id}`, 404);
    
    equipment.status = 'active';
    await equipment.save();

    const issue = await EquipmentIssue.findOne({ equipmentId: id, status: { $ne: 'resolved' } });
    if (issue) {
      issue.status = 'resolved';
      issue.resolvedAt = new Date();
      await issue.save();
    }
    
    return equipment;
  }
,
  exportEquipment: async () => {
    const equipment = await WarehouseEquipment.find();
    const csv = `id,name,type,status,location\n${equipment.map(e => `${e.id},${e.name},${e.type},${e.status},${e.location || ''}`).join('\n')}`;
    return csv;
  }
};

module.exports = equipmentService;

