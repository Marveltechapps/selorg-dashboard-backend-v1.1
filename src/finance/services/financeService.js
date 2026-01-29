const TaxRule = require('../models/TaxRule');
const CommissionSlab = require('../models/CommissionSlab');
const PayoutSchedule = require('../models/PayoutSchedule');
const RefundPolicy = require('../models/RefundPolicy');
const logger = require('../../utils/logger');

class FinanceService {
  async getTaxRules() {
    try {
      const rules = await TaxRule.find().lean().sort({ createdAt: -1 });
      return rules;
    } catch (error) {
      logger.error('Error fetching tax rules:', error);
      throw error;
    }
  }

  async createTaxRule(data) {
    try {
      const rule = new TaxRule({
        ...data,
        isActive: data.isActive ?? true,
        effectiveFrom: new Date(data.effectiveFrom),
      });
      await rule.save();
      return rule.toObject();
    } catch (error) {
      logger.error('Error creating tax rule:', error);
      throw error;
    }
  }

  async updateTaxRule(ruleId, data) {
    try {
      const updateData = { ...data };
      if (data.effectiveFrom) updateData.effectiveFrom = new Date(data.effectiveFrom);
      const rule = await TaxRule.findByIdAndUpdate(
        ruleId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).lean();
      return rule;
    } catch (error) {
      logger.error('Error updating tax rule:', error);
      throw error;
    }
  }

  async getCommissionSlabs() {
    try {
      const slabs = await CommissionSlab.find().lean().sort({ createdAt: -1 });
      return slabs;
    } catch (error) {
      logger.error('Error fetching commission slabs:', error);
      throw error;
    }
  }

  async createCommissionSlab(data) {
    try {
      const slab = new CommissionSlab({
        ...data,
        effectiveFrom: new Date(data.effectiveFrom),
      });
      await slab.save();
      return slab.toObject();
    } catch (error) {
      logger.error('Error creating commission slab:', error);
      throw error;
    }
  }

  async updateCommissionSlab(slabId, data) {
    try {
      const updateData = { ...data };
      if (data.effectiveFrom) updateData.effectiveFrom = new Date(data.effectiveFrom);
      const slab = await CommissionSlab.findByIdAndUpdate(
        slabId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).lean();
      return slab;
    } catch (error) {
      logger.error('Error updating commission slab:', error);
      throw error;
    }
  }

  async getPayoutSchedules() {
    try {
      const schedules = await PayoutSchedule.find().lean().sort({ createdAt: -1 });
      return schedules;
    } catch (error) {
      logger.error('Error fetching payout schedules:', error);
      throw error;
    }
  }

  async updatePayoutSchedule(scheduleId, data) {
    try {
      const schedule = await PayoutSchedule.findByIdAndUpdate(
        scheduleId,
        { $set: data },
        { new: true, runValidators: true }
      ).lean();
      return schedule;
    } catch (error) {
      logger.error('Error updating payout schedule:', error);
      throw error;
    }
  }

  async getRefundPolicies() {
    try {
      const policies = await RefundPolicy.find().lean().sort({ createdAt: -1 });
      return policies;
    } catch (error) {
      logger.error('Error fetching refund policies:', error);
      throw error;
    }
  }

  async updateRefundPolicy(policyId, data) {
    try {
      const policy = await RefundPolicy.findByIdAndUpdate(
        policyId,
        { $set: data },
        { new: true, runValidators: true }
      ).lean();
      return policy;
    } catch (error) {
      logger.error('Error updating refund policy:', error);
      throw error;
    }
  }

  async getReconciliationRules() {
    try {
      return [];
    } catch (error) {
      logger.error('Error fetching reconciliation rules:', error);
      throw error;
    }
  }

  async updateReconciliationRule(ruleId, data) {
    try {
      return { id: ruleId, ...data };
    } catch (error) {
      logger.error('Error updating reconciliation rule:', error);
      throw error;
    }
  }

  async getInvoiceSettings() {
    try {
      return {
        format: 'standard',
        includeTax: true,
        autoGenerate: false,
      };
    } catch (error) {
      logger.error('Error fetching invoice settings:', error);
      throw error;
    }
  }

  async updateInvoiceSettings(data) {
    try {
      return { ...data, updatedAt: new Date() };
    } catch (error) {
      logger.error('Error updating invoice settings:', error);
      throw error;
    }
  }

  async getPaymentTerms() {
    try {
      return [];
    } catch (error) {
      logger.error('Error fetching payment terms:', error);
      throw error;
    }
  }

  async updatePaymentTerm(termId, data) {
    try {
      return { id: termId, ...data };
    } catch (error) {
      logger.error('Error updating payment term:', error);
      throw error;
    }
  }

  async getFinancialLimits() {
    try {
      return [];
    } catch (error) {
      logger.error('Error fetching financial limits:', error);
      throw error;
    }
  }

  async updateFinancialLimit(limitId, data) {
    try {
      return { id: limitId, ...data };
    } catch (error) {
      logger.error('Error updating financial limit:', error);
      throw error;
    }
  }

  async getFinancialYear() {
    try {
      return {
        startDate: '2024-04-01',
        endDate: '2025-03-31',
        isActive: true,
      };
    } catch (error) {
      logger.error('Error fetching financial year:', error);
      throw error;
    }
  }

  async updateFinancialYear(data) {
    try {
      return { ...data, updatedAt: new Date() };
    } catch (error) {
      logger.error('Error updating financial year:', error);
      throw error;
    }
  }
}

module.exports = new FinanceService();
