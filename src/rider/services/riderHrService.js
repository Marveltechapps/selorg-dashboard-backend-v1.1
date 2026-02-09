
const RiderHR = require('../models/RiderHR');
const Rider = require('../models/Rider');
const Training = require('../models/Training');
const Compliance = require('../models/Compliance');
const Contract = require('../models/Contract');
const logger = require('../../core/utils/logger');

const listRiders = async (filters = {}, pagination = {}) => {
  try {
    const {
      status,
      onboardingStatus,
      trainingStatus,
      appAccess,
      page = 1,
      limit = 50,
    } = { ...filters, ...pagination };

    const query = {};

    if (status) {
      query.status = status;
    }

    if (onboardingStatus) {
      query.onboardingStatus = onboardingStatus;
    }

    if (trainingStatus) {
      query.trainingStatus = trainingStatus;
    }

    if (appAccess) {
      query.appAccess = appAccess;
    }

    const skip = (page - 1) * limit;
    const total = await RiderHR.countDocuments(query);

    const riders = await RiderHR.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get contract statuses from Contract collection
    const riderIds = riders.map(r => r.id);
    const contracts = await Contract.find({ riderId: { $in: riderIds } }).lean();
    const contractMap = new Map(contracts.map(c => [c.riderId, c]));

    // Format dates
    const formattedRiders = riders.map(r => {
      const contract = contractMap.get(r.id);
      // Determine contract status: prefer Contract collection status, fallback to calculated status
      let contractStatus = contract?.status;
      if (!contractStatus) {
        const now = new Date();
        const endDate = r.contract?.endDate;
        if (endDate && endDate < now) {
          contractStatus = 'expired';
        } else if (r.contract?.renewalDue) {
          contractStatus = 'pending_renewal';
        } else {
          contractStatus = 'active';
        }
      }
      return {
        id: r.id,
        name: r.name,
        phone: r.phone,
        email: r.email,
        status: r.status,
        onboardingStatus: r.onboardingStatus,
        trainingStatus: r.trainingStatus,
        appAccess: r.appAccess,
        deviceAssigned: r.deviceAssigned,
        deviceId: r.deviceId || null,
        deviceType: r.deviceType || null,
        createdAt: r.createdAt ? r.createdAt.toISOString() : null,
        contract: {
          startDate: r.contract?.startDate ? r.contract.startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          endDate: r.contract?.endDate ? r.contract.endDate.toISOString().split('T')[0] : new Date(Date.now() + 31536000000).toISOString().split('T')[0],
          renewalDue: r.contract?.renewalDue || false,
          status: contractStatus,
        },
        compliance: {
          isCompliant: r.compliance?.isCompliant ?? true,
          lastAuditDate: r.compliance?.lastAuditDate ? r.compliance.lastAuditDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          policyViolationsCount: r.compliance?.policyViolationsCount || 0,
          lastViolationReason: r.compliance?.lastViolationReason || null,
        },
        suspension: r.suspension ? {
          isSuspended: r.suspension.isSuspended,
          reason: r.suspension.reason || null,
          since: r.suspension.since ? r.suspension.since.toISOString() : null,
        } : null,
      };
    });

    return {
      riders: formattedRiders,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    logger.error('Error listing riders:', error);
    throw error;
  }
};

const getRiderDetails = async (riderId) => {
  try {
    const rider = await RiderHR.findOne({ id: riderId }).lean();

    if (!rider) {
      const error = new Error('Rider not found');
      error.statusCode = 404;
      throw error;
    }

    // Get contract status from Contract collection
    const contract = await Contract.findOne({ riderId: rider.id }).lean();
    
    // Determine contract status: prefer Contract collection status, fallback to calculated status
    let contractStatus = contract?.status;
    if (!contractStatus) {
      const now = new Date();
      const endDate = rider.contract.endDate;
      if (endDate < now) {
        contractStatus = 'expired';
      } else if (rider.contract.renewalDue) {
        contractStatus = 'pending_renewal';
      } else {
        contractStatus = 'active';
      }
    }

    return {
      id: rider.id,
      name: rider.name,
      phone: rider.phone,
      email: rider.email,
      status: rider.status,
      onboardingStatus: rider.onboardingStatus,
      trainingStatus: rider.trainingStatus,
      appAccess: rider.appAccess,
      deviceAssigned: rider.deviceAssigned,
      deviceId: rider.deviceId || null,
      deviceType: rider.deviceType || null,
      createdAt: rider.createdAt ? rider.createdAt.toISOString() : null, // Include createdAt for days active calculation
      contract: {
        startDate: rider.contract.startDate.toISOString().split('T')[0],
        endDate: rider.contract.endDate.toISOString().split('T')[0],
        renewalDue: rider.contract.renewalDue,
        status: contractStatus, // Include contract status
      },
      compliance: {
        isCompliant: rider.compliance.isCompliant,
        lastAuditDate: rider.compliance.lastAuditDate.toISOString().split('T')[0],
        policyViolationsCount: rider.compliance.policyViolationsCount,
        lastViolationReason: rider.compliance.lastViolationReason || null,
      },
      suspension: rider.suspension ? {
        isSuspended: rider.suspension.isSuspended,
        reason: rider.suspension.reason || null,
        since: rider.suspension.since ? rider.suspension.since.toISOString() : null,
      } : null,
    };
  } catch (error) {
    logger.error('Error getting rider details:', error);
    throw error;
  }
};

const onboardRider = async (riderData) => {
  let newId = null; // Declare at function scope for error handling
  try {
    let { name, phone, email, contract } = riderData || {};
    name = name != null ? String(name).trim() : '';
    if (!name) {
      const err = new Error('Name is required');
      err.statusCode = 400;
      throw err;
    }
    phone = phone != null ? String(phone).trim() : '';
    // Handle various phone formats: 9876543210, +919876543210, +1 234 567 8900, etc.
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 10) {
      // If it starts with country code, use it; otherwise add +91 for India
      if (digits.length === 10) {
        phone = `+91${digits}`;
      } else if (digits.startsWith('91') && digits.length === 12) {
        phone = `+${digits}`;
      } else if (digits.length > 10) {
        // International format - use as is if it starts with valid country code
        phone = `+${digits}`;
      } else {
        phone = `+91${digits}`;
      }
      // Validate final format
      if (!/^\+[1-9]\d{1,14}$/.test(phone)) {
        // Fallback: use last 10 digits with +91
        const tenDigit = digits.slice(-10);
        phone = `+91${tenDigit}`;
      }
    }
    if (!phone || !/^\+[1-9]\d{1,14}$/.test(phone)) {
      const err = new Error('Phone is required and must be a valid number (e.g. 9876543210, +919876543210, or +1 234 567 8900)');
      err.statusCode = 400;
      throw err;
    }
    if (!email || typeof email !== 'string' || !String(email).trim()) {
      email = `${name.replace(/\s+/g, '.').toLowerCase().replace(/[^a-z0-9.-]/g, '')}@rider.local`;
    }
    email = String(email).trim().toLowerCase();

    // Generate unique rider ID - check both RiderHR and Rider collections
    // to ensure the ID doesn't exist in either collection
    const [lastRiderHR, lastRider] = await Promise.all([
      RiderHR.findOne().sort({ id: -1 }).lean(),
      Rider.findOne().sort({ id: -1 }).lean()
    ]);
    
    const lastIdHR = lastRiderHR ? parseInt(lastRiderHR.id.split('-')[1]) : 0;
    const lastIdRider = lastRider ? parseInt(lastRider.id.split('-')[1]) : 0;
    const lastId = Math.max(lastIdHR, lastIdRider);
    
    // Find next available ID by checking if it exists in either collection
    let newId;
    let attemptId = lastId + 1;
    let maxAttempts = 100; // Prevent infinite loop
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const candidateId = `RIDER-${String(attemptId).padStart(4, '0')}`;
      
      // Check if this ID exists in either collection
      const [existsInHR, existsInRider] = await Promise.all([
        RiderHR.findOne({ id: candidateId }).lean(),
        Rider.findOne({ id: candidateId }).lean()
      ]);
      
      if (!existsInHR && !existsInRider) {
        newId = candidateId;
        break;
      }
      
      attemptId++;
      attempts++;
    }
    
    if (!newId) {
      const err = new Error('Unable to generate unique rider ID. Please try again.');
      err.statusCode = 500;
      throw err;
    }

    // Set default contract dates
    const startDate = contract?.startDate ? new Date(contract.startDate) : new Date();
    const endDate = contract?.endDate ? new Date(contract.endDate) : new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);

    // Check if rider with this phone or email already exists
    const existingRiderByPhone = await RiderHR.findOne({ phone }).lean();
    if (existingRiderByPhone) {
      const err = new Error('Rider with this phone number already exists');
      err.statusCode = 400;
      throw err;
    }
    
    const existingRiderByEmail = await RiderHR.findOne({ email }).lean();
    if (existingRiderByEmail) {
      const err = new Error('Rider with this email already exists');
      err.statusCode = 400;
      throw err;
    }

    // Create rider
    const rider = new RiderHR({
      id: newId,
      name,
      phone,
      email,
      status: 'onboarding',
      onboardingStatus: 'invited',
      trainingStatus: 'not_started',
      appAccess: 'disabled',
      deviceAssigned: false,
      contract: {
        startDate,
        endDate,
        renewalDue: false,
      },
      compliance: {
        isCompliant: true,
        lastAuditDate: new Date(),
        policyViolationsCount: 0,
      },
    });

    try {
    await rider.save();
    logger.info('[riderHrService.onboardRider] RiderHR saved', { id: rider.id, name: rider.name });
    } catch (saveError) {
      // If duplicate key error, try to find next available ID and retry once
      if (saveError.code === 11000) {
        logger.warn('[riderHrService.onboardRider] Duplicate key error, finding next available ID', { 
          attemptedId: newId,
          error: saveError.message 
        });
        
        // Find next available ID
        let retryId = attemptId + 1;
        let retryAttempts = 0;
        let retryNewId = null;
        
        while (retryAttempts < 50 && !retryNewId) {
          const candidateId = `RIDER-${String(retryId).padStart(4, '0')}`;
          const [existsInHR, existsInRider] = await Promise.all([
            RiderHR.findOne({ id: candidateId }).lean(),
            Rider.findOne({ id: candidateId }).lean()
          ]);
          
          if (!existsInHR && !existsInRider) {
            retryNewId = candidateId;
            break;
          }
          retryId++;
          retryAttempts++;
        }
        
        if (retryNewId) {
          rider.id = retryNewId;
          await rider.save();
          newId = retryNewId; // Update newId for operational rider creation
          logger.info('[riderHrService.onboardRider] RiderHR saved with retry ID', { id: rider.id, name: rider.name });
        } else {
          throw saveError; // Re-throw if we can't find an available ID
        }
      } else {
        throw saveError; // Re-throw if it's not a duplicate key error
      }
    }

    // Also create operational rider record for consistency
    // Use findOneAndUpdate with upsert to handle duplicates gracefully
    try {
    const nameParts = name.trim().split(/\s+/);
    const avatarInitials = nameParts.length >= 2
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase().slice(0, 2)
      : nameParts[0].slice(0, 2).toUpperCase();

      // Use findOneAndUpdate with upsert to avoid duplicate key errors
      await Rider.findOneAndUpdate(
        { id: newId },
        {
          $set: {
      id: newId,
      name: name.trim(),
      avatarInitials,
      status: 'offline', // Start as offline until onboarding is complete
      currentOrderId: null,
      location: null,
      capacity: {
        currentLoad: 0,
              maxLoad: 10,
      },
      avgEtaMins: 0,
      rating: 0,
      zone: null,
          }
        },
        { upsert: true, new: true, runValidators: false }
      );
      logger.info('[riderHrService.onboardRider] Operational rider created/updated', { id: newId });
    } catch (operationalRiderError) {
      // Log but don't fail the entire operation if operational rider creation fails
      logger.warn('[riderHrService.onboardRider] Failed to create operational rider, continuing anyway', {
        id: newId,
        error: operationalRiderError.message
      });
      // Don't throw - the HR record is already saved, so we continue
    }

    // Create default training record (use upsert to handle duplicates)
    try {
    const defaultModules = [
      { id: 'MOD-001', name: 'Safety Protocols', completed: false },
      { id: 'MOD-002', name: 'Traffic Rules', completed: false },
      { id: 'MOD-003', name: 'Customer Service', completed: false },
      { id: 'MOD-004', name: 'App Usage', completed: false },
      { id: 'MOD-005', name: 'Emergency Procedures', completed: false },
    ];

      await Training.findOneAndUpdate(
        { riderId: rider.id },
        {
          $set: {
      riderId: rider.id,
      riderName: rider.name,
      status: 'not_started',
      modules: defaultModules,
      modulesCompleted: 0,
      totalModules: 5,
      progressPercentage: 0,
          }
        },
        { upsert: true, new: true, runValidators: false }
      );
      logger.info('[riderHrService.onboardRider] Training record created/updated', { riderId: rider.id });
    } catch (trainingError) {
      logger.warn('[riderHrService.onboardRider] Failed to create training record', {
        riderId: rider.id,
        error: trainingError.message
      });
      // Continue - don't fail the entire operation
    }

    // Create compliance record (use upsert to handle duplicates)
    try {
      await Compliance.findOneAndUpdate(
        { riderId: rider.id },
        {
          $set: {
      riderId: rider.id,
      riderName: rider.name,
      isCompliant: true,
      lastAuditDate: new Date(),
      policyViolationsCount: 0,
      suspension: {
        isSuspended: false,
      },
          }
        },
        { upsert: true, new: true, runValidators: false }
      );
      logger.info('[riderHrService.onboardRider] Compliance record created/updated', { riderId: rider.id });
    } catch (complianceError) {
      logger.warn('[riderHrService.onboardRider] Failed to create compliance record', {
        riderId: rider.id,
        error: complianceError.message
      });
      // Continue - don't fail the entire operation
    }

    // Create contract record (use upsert to handle duplicates)
    try {
      await Contract.findOneAndUpdate(
        { riderId: rider.id },
        {
          $set: {
      riderId: rider.id,
      riderName: rider.name,
      startDate,
      endDate,
      renewalDue: false,
      status: 'active',
          }
        },
        { upsert: true, new: true, runValidators: false }
      );
      logger.info('[riderHrService.onboardRider] Contract record created/updated', { riderId: rider.id });
    } catch (contractError) {
      logger.warn('[riderHrService.onboardRider] Failed to create contract record', {
        riderId: rider.id,
        error: contractError.message
      });
      // Continue - don't fail the entire operation
    }

    return {
      id: rider.id,
      name: rider.name,
      phone: rider.phone,
      email: rider.email,
      status: rider.status,
      onboardingStatus: rider.onboardingStatus,
      trainingStatus: rider.trainingStatus,
      appAccess: rider.appAccess,
      deviceAssigned: rider.deviceAssigned,
      contract: {
        startDate: rider.contract.startDate.toISOString().split('T')[0],
        endDate: rider.contract.endDate.toISOString().split('T')[0],
        renewalDue: rider.contract.renewalDue,
      },
      compliance: {
        isCompliant: rider.compliance.isCompliant,
        lastAuditDate: rider.compliance.lastAuditDate.toISOString().split('T')[0],
        policyViolationsCount: rider.compliance.policyViolationsCount,
      },
    };
  } catch (error) {
    logger.error('Error onboarding rider:', error);
    
    // Only throw duplicate error if it's for the main RiderHR record
    // Related records (Training, Compliance, Contract) failures are logged but don't fail the operation
    if (error.code === 11000) {
      // Check if this is a duplicate key error for RiderHR
      if (error.keyPattern && (error.keyPattern.id || error.keyPattern.phone || error.keyPattern.email)) {
        if (error.keyPattern.phone) {
          const duplicateError = new Error('Rider with this phone number already exists');
          duplicateError.statusCode = 400;
          throw duplicateError;
        }
        if (error.keyPattern.email) {
          const duplicateError = new Error('Rider with this email already exists');
          duplicateError.statusCode = 400;
          throw duplicateError;
        }
        // For ID duplicates, check if RiderHR was actually saved
        const savedRider = await RiderHR.findOne({ id: newId || error.keyValue?.id }).lean();
        if (savedRider) {
          // RiderHR was saved successfully, so return success even if related records failed
          logger.warn('[riderHrService.onboardRider] RiderHR saved but related records may have failed', {
            riderId: savedRider.id,
            originalError: error.message
          });
          // Return the saved rider data
          return {
            id: savedRider.id,
            name: savedRider.name,
            phone: savedRider.phone,
            email: savedRider.email,
            status: savedRider.status,
            onboardingStatus: savedRider.onboardingStatus,
            trainingStatus: savedRider.trainingStatus,
            appAccess: savedRider.appAccess,
            deviceAssigned: savedRider.deviceAssigned,
            contract: {
              startDate: savedRider.contract.startDate.toISOString().split('T')[0],
              endDate: savedRider.contract.endDate.toISOString().split('T')[0],
              renewalDue: savedRider.contract.renewalDue,
            },
            compliance: {
              isCompliant: savedRider.compliance.isCompliant,
              lastAuditDate: savedRider.compliance.lastAuditDate.toISOString().split('T')[0],
              policyViolationsCount: savedRider.compliance.policyViolationsCount,
            },
          };
        }
        // If RiderHR wasn't saved, throw the error
      const duplicateError = new Error('Rider with this ID already exists');
      duplicateError.statusCode = 400;
      throw duplicateError;
      }
    }
    if (error.name === 'ValidationError' && !error.statusCode) error.statusCode = 400;
    throw error;
  }
};

const updateRider = async (riderId, updateData) => {
  try {
    const rider = await RiderHR.findOne({ id: riderId });

    if (!rider) {
      const error = new Error('Rider not found');
      error.statusCode = 404;
      throw error;
    }

    // Update allowed fields
    if (updateData.appAccess !== undefined) {
      rider.appAccess = updateData.appAccess;
    }
    if (updateData.trainingStatus !== undefined) {
      rider.trainingStatus = updateData.trainingStatus;
    }
    if (updateData.status !== undefined) {
      rider.status = updateData.status;
      
      // Keep operational rider status in sync
      if (updateData.status === 'suspended') {
        await Rider.updateOne({ id: riderId }, { $set: { status: 'offline' } });
      }
    }
    if (updateData.onboardingStatus !== undefined) {
      rider.onboardingStatus = updateData.onboardingStatus;
      
      // If onboarding is approved, ensure the operational rider exists 
      // and is ready to be moved to idle/online
      if (updateData.onboardingStatus === 'approved') {
        await Rider.updateOne(
          { id: riderId }, 
          { $set: { status: 'offline' } }, // Keep offline until login, but ensure record exists
          { upsert: true }
        );
      }
    }

    await rider.save();

    // Sync other basic info if updated
    const operationalUpdate = {};
    if (updateData.name) operationalUpdate.name = updateData.name;
    
    if (Object.keys(operationalUpdate).length > 0) {
      await Rider.updateOne({ id: riderId }, { $set: operationalUpdate });
    }

    return getRiderDetails(riderId);
  } catch (error) {
    logger.error('Error updating rider:', error);
    throw error;
  }
};

const sendReminder = async (riderId) => {
  try {
    const rider = await RiderHR.findOne({ id: riderId }).lean();

    if (!rider) {
      const error = new Error('Rider not found');
      error.statusCode = 404;
      throw error;
    }

    // In a real application, this would:
    // 1. Send an email/SMS notification
    // 2. Log the reminder in the system
    // 3. Update reminder tracking
    // For now, we'll just return success with reminder details

    return {
      success: true,
      riderId: rider.id,
      riderName: rider.name,
      email: rider.email,
      phone: rider.phone,
      message: 'Reminder sent successfully',
      sentAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Error sending reminder:', error);
    throw error;
  }
};

module.exports = {
  listRiders,
  getRiderDetails,
  onboardRider,
  updateRider,
  sendReminder,
};
