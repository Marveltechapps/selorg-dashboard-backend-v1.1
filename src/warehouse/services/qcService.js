<<<<<<< HEAD
const QCInspection = require('../models/QCInspection');
const TemperatureLog = require('../models/TemperatureLog');
const ComplianceDoc = require('../models/ComplianceDoc');
const SampleTest = require('../models/SampleTest');
const BatchRejection = require('../models/BatchRejection');
const ErrorResponse = require("../../core/utils/ErrorResponse");

/**
 * @desc QC & Compliance Service
 */
const qcService = {
  // --- Inspections ---
  listInspections: async () => {
    const inspections = await QCInspection.find().sort({ createdAt: -1 }).lean();
    return inspections.map(i => ({
      id: i.id,
      inspectionId: i.inspectionId || i.id,
      batchId: i.batchId,
      productName: i.productName,
      inspector: i.inspector || 'System',
      date: i.date ? new Date(i.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: i.status || 'pending',
      score: i.score || 0,
      itemsInspected: i.itemsInspected || 0,
      defectsFound: i.defectsFound || 0
    }));
  },

  createInspection: async (data) => {
    if (!data.id) {
      const count = await QCInspection.countDocuments();
      data.id = `INS-${(count + 1).toString().padStart(3, '0')}`;
    }
    return await QCInspection.create(data);
  },

  getInspectionById: async (id) => {
    const i = await QCInspection.findOne({ id }).lean();
    if (!i) throw new ErrorResponse(`Inspection not found with id ${id}`, 404);
    return {
      id: i.id,
      inspectionId: i.inspectionId || i.id,
      batchId: i.batchId,
      productName: i.productName,
      inspector: i.inspector || 'System',
      date: i.date ? new Date(i.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: i.status || 'pending',
      score: i.score || 0,
      itemsInspected: i.itemsInspected || 0,
      defectsFound: i.defectsFound || 0
    };
  },

  updateInspection: async (id, data) => {
    const inspection = await QCInspection.findOne({ id });
    if (!inspection) throw new ErrorResponse(`Inspection not found with id ${id}`, 404);
    Object.assign(inspection, data);
    await inspection.save();
    return inspection;
  },

  // --- Temperature Logs ---
  listTemperatureLogs: async () => {
    const logs = await TemperatureLog.find().sort({ createdAt: -1 }).lean();
    return logs.map(l => ({
      id: l.id,
      zone: l.zone,
      temperature: l.temperature,
      humidity: l.humidity,
      timestamp: l.timestamp ? new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: l.status || 'normal'
    }));
  },

  createTemperatureLog: async (data) => {
    if (!data.id) {
      const count = await TemperatureLog.countDocuments();
      data.id = `TEMP-${(count + 1).toString().padStart(3, '0')}`;
    }
    return await TemperatureLog.create(data);
  },

  getTempChartData: async (id, period = '24h') => {
    const log = await TemperatureLog.findOne({ id });
    if (!log) throw new ErrorResponse(`Log not found with id ${id}`, 404);
    
    // Generate historical points from DB or simulate based on current log
    const dataPoints = [];
    const now = new Date();
    const count = period === '24h' ? 24 : period === '7d' ? 7 : 12;
    
    for (let i = 0; i < count; i++) {
      dataPoints.push({
        timestamp: new Date(now.getTime() - (count - 1 - i) * 3600000).toISOString(),
        temperature: log.temperature + (Math.sin(i / 2) * 0.5), // Simulated oscillation
        humidity: log.humidity + (Math.cos(i / 2) * 1.5)
      });
    }

    return {
      zone: log.zone,
      period,
      dataPoints,
      statistics: {
        minTemp: log.temperature - 0.8,
        maxTemp: log.temperature + 0.8,
        avgTemp: log.temperature
      }
    };
  },

  // --- Rejections ---
  listRejections: async () => {
    const rejections = await BatchRejection.find().sort({ createdAt: -1 }).lean();
    return rejections.map(r => ({
      id: r.id,
      batch: r.batchId,
      reason: r.reason,
      items: r.itemsCount || r.items || 0,
      timestamp: r.createdAt ? new Date(r.createdAt).toLocaleString() : new Date().toLocaleString(),
      inspector: r.inspector || 'System',
      severity: r.severity || 'medium'
    }));
  },

  logRejection: async (data) => {
    if (!data.id) {
      const count = await BatchRejection.countDocuments();
      data.id = `REJ-${(count + 1).toString().padStart(3, '0')}`;
    }
    // Handle frontend fields mapping to model
    const mappedData = {
      ...data,
      batchId: data.batchId || data.batch,
      itemsCount: data.itemsCount || data.items
    };
    return await BatchRejection.create(mappedData);
  },

  // --- Compliance Docs ---
  listComplianceDocs: async () => {
    const docs = await ComplianceDoc.find().sort({ createdAt: -1 }).lean();
    return docs.map(d => ({
      id: d.id,
      docId: d.docId || d.id,
      docName: d.docName || d.title || 'Untitled Document',
      type: d.type || 'License',
      issuedDate: d.issuedDate ? new Date(d.issuedDate).toISOString().split('T')[0] : '2023-01-01',
      expiryDate: d.expiryDate ? new Date(d.expiryDate).toISOString().split('T')[0] : '2025-01-01',
      status: d.status || 'valid'
    }));
  },

  getComplianceDoc: async (id) => {
    const d = await ComplianceDoc.findOne({ id }).lean();
    if (!d) throw new ErrorResponse(`Document not found with id ${id}`, 404);
    return {
      id: d.id,
      docId: d.docId || d.id,
      docName: d.docName || d.title || 'Untitled Document',
      type: d.type || 'License',
      issuedDate: d.issuedDate ? new Date(d.issuedDate).toISOString().split('T')[0] : '2023-01-01',
      expiryDate: d.expiryDate ? new Date(d.expiryDate).toISOString().split('T')[0] : '2025-01-01',
      status: d.status || 'valid'
    };
  },

  // --- Sample Tests ---
  listSamples: async () => {
    const samples = await SampleTest.find().sort({ createdAt: -1 }).lean();
    return samples.map(s => ({
      id: s.id,
      sampleId: s.sampleId || s.id,
      batchId: s.batchId,
      productName: s.productName,
      testType: s.testType,
      result: s.result || 'pending',
      testedBy: s.testedBy || 'System',
      date: s.date ? new Date(s.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    }));
  },

  createSample: async (data) => {
    if (!data.id) {
      const count = await SampleTest.countDocuments();
      data.id = `SMP-${(count + 1).toString().padStart(3, '0')}`;
    }
    return await SampleTest.create(data);
  },

  updateSample: async (id, data) => {
    const sample = await SampleTest.findOne({ id });
    if (!sample) throw new ErrorResponse(`Sample test not found with id ${id}`, 404);
    Object.assign(sample, data);
    await sample.save();
    return sample;
  }
};

module.exports = qcService;

=======
const QCInspection = require('../models/QCInspection');
const TemperatureLog = require('../models/TemperatureLog');
const ComplianceDoc = require('../models/ComplianceDoc');
const SampleTest = require('../models/SampleTest');
const BatchRejection = require('../models/BatchRejection');
const ErrorResponse = require("../../core/utils/ErrorResponse");

/**
 * @desc QC & Compliance Service
 */
const qcService = {
  // --- Inspections ---
  listInspections: async () => {
    const inspections = await QCInspection.find().sort({ createdAt: -1 }).lean();
    return inspections.map(i => ({
      id: i.id,
      inspectionId: i.inspectionId || i.id,
      batchId: i.batchId,
      productName: i.productName,
      inspector: i.inspector || 'System',
      date: i.date ? new Date(i.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: i.status || 'pending',
      score: i.score || 0,
      itemsInspected: i.itemsInspected || 0,
      defectsFound: i.defectsFound || 0
    }));
  },

  createInspection: async (data) => {
    if (!data.id) {
      const count = await QCInspection.countDocuments();
      data.id = `INS-${(count + 1).toString().padStart(3, '0')}`;
    }
    return await QCInspection.create(data);
  },

  getInspectionById: async (id) => {
    const i = await QCInspection.findOne({ id }).lean();
    if (!i) throw new ErrorResponse(`Inspection not found with id ${id}`, 404);
    return {
      id: i.id,
      inspectionId: i.inspectionId || i.id,
      batchId: i.batchId,
      productName: i.productName,
      inspector: i.inspector || 'System',
      date: i.date ? new Date(i.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: i.status || 'pending',
      score: i.score || 0,
      itemsInspected: i.itemsInspected || 0,
      defectsFound: i.defectsFound || 0
    };
  },

  updateInspection: async (id, data) => {
    const inspection = await QCInspection.findOne({ id });
    if (!inspection) throw new ErrorResponse(`Inspection not found with id ${id}`, 404);
    Object.assign(inspection, data);
    await inspection.save();
    return inspection;
  },

  // --- Temperature Logs ---
  listTemperatureLogs: async () => {
    const logs = await TemperatureLog.find().sort({ createdAt: -1 }).lean();
    return logs.map(l => ({
      id: l.id,
      zone: l.zone,
      temperature: l.temperature,
      humidity: l.humidity,
      timestamp: l.timestamp ? new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: l.status || 'normal'
    }));
  },

  createTemperatureLog: async (data) => {
    if (!data.id) {
      const count = await TemperatureLog.countDocuments();
      data.id = `TEMP-${(count + 1).toString().padStart(3, '0')}`;
    }
    return await TemperatureLog.create(data);
  },

  getTempChartData: async (id, period = '24h') => {
    const log = await TemperatureLog.findOne({ id });
    if (!log) throw new ErrorResponse(`Log not found with id ${id}`, 404);
    
    // Generate historical points from DB or simulate based on current log
    const dataPoints = [];
    const now = new Date();
    const count = period === '24h' ? 24 : period === '7d' ? 7 : 12;
    
    for (let i = 0; i < count; i++) {
      dataPoints.push({
        timestamp: new Date(now.getTime() - (count - 1 - i) * 3600000).toISOString(),
        temperature: log.temperature + (Math.sin(i / 2) * 0.5), // Simulated oscillation
        humidity: log.humidity + (Math.cos(i / 2) * 1.5)
      });
    }

    return {
      zone: log.zone,
      period,
      dataPoints,
      statistics: {
        minTemp: log.temperature - 0.8,
        maxTemp: log.temperature + 0.8,
        avgTemp: log.temperature
      }
    };
  },

  // --- Rejections ---
  listRejections: async () => {
    const rejections = await BatchRejection.find().sort({ createdAt: -1 }).lean();
    return rejections.map(r => ({
      id: r.id,
      batch: r.batchId,
      reason: r.reason,
      items: r.itemsCount || r.items || 0,
      timestamp: r.createdAt ? new Date(r.createdAt).toLocaleString() : new Date().toLocaleString(),
      inspector: r.inspector || 'System',
      severity: r.severity || 'medium'
    }));
  },

  logRejection: async (data) => {
    if (!data.id) {
      const count = await BatchRejection.countDocuments();
      data.id = `REJ-${(count + 1).toString().padStart(3, '0')}`;
    }
    // Handle frontend fields mapping to model
    const mappedData = {
      ...data,
      batchId: data.batchId || data.batch,
      itemsCount: data.itemsCount || data.items
    };
    return await BatchRejection.create(mappedData);
  },

  // --- Compliance Docs ---
  listComplianceDocs: async () => {
    const docs = await ComplianceDoc.find().sort({ createdAt: -1 }).lean();
    return docs.map(d => ({
      id: d.id,
      docId: d.docId || d.id,
      docName: d.docName || d.title || 'Untitled Document',
      type: d.type || 'License',
      issuedDate: d.issuedDate ? new Date(d.issuedDate).toISOString().split('T')[0] : '2023-01-01',
      expiryDate: d.expiryDate ? new Date(d.expiryDate).toISOString().split('T')[0] : '2025-01-01',
      status: d.status || 'valid'
    }));
  },

  getComplianceDoc: async (id) => {
    const d = await ComplianceDoc.findOne({ id }).lean();
    if (!d) throw new ErrorResponse(`Document not found with id ${id}`, 404);
    return {
      id: d.id,
      docId: d.docId || d.id,
      docName: d.docName || d.title || 'Untitled Document',
      type: d.type || 'License',
      issuedDate: d.issuedDate ? new Date(d.issuedDate).toISOString().split('T')[0] : '2023-01-01',
      expiryDate: d.expiryDate ? new Date(d.expiryDate).toISOString().split('T')[0] : '2025-01-01',
      status: d.status || 'valid'
    };
  },

  // --- Sample Tests ---
  listSamples: async () => {
    const samples = await SampleTest.find().sort({ createdAt: -1 }).lean();
    return samples.map(s => ({
      id: s.id,
      sampleId: s.sampleId || s.id,
      batchId: s.batchId,
      productName: s.productName,
      testType: s.testType,
      result: s.result || 'pending',
      testedBy: s.testedBy || 'System',
      date: s.date ? new Date(s.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    }));
  },

  createSample: async (data) => {
    if (!data.id) {
      const count = await SampleTest.countDocuments();
      data.id = `SMP-${(count + 1).toString().padStart(3, '0')}`;
    }
    return await SampleTest.create(data);
  },

  updateSample: async (id, data) => {
    const sample = await SampleTest.findOne({ id });
    if (!sample) throw new ErrorResponse(`Sample test not found with id ${id}`, 404);
    Object.assign(sample, data);
    await sample.save();
    return sample;
  }
};

module.exports = qcService;

>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
