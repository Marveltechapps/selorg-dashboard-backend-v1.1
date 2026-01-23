const utilitiesService = require('../../../src/warehouse/services/utilitiesService');

describe('UtilitiesService', () => {
  describe('uploadSKUs', () => {
    it('should return success response with imported count', async () => {
      const result = await utilitiesService.uploadSKUs({});
      
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('imported');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('message');
    });
  });

  describe('getAccessLogs', () => {
    it('should return access logs array', async () => {
      const result = await utilitiesService.getAccessLogs();
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should filter by user when provided', async () => {
      const filters = { user: 'test-user' };
      const result = await utilitiesService.getAccessLogs(filters);
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('generateLabels', () => {
    it('should return label generation result', async () => {
      const result = await utilitiesService.generateLabels({});
      
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('labelCount');
      expect(result).toHaveProperty('printUrl');
    });
  });
});
