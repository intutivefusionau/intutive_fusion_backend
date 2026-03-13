const {
  isValidEmail,
  maskString,
  formatBytes,
  sanitizeObject,
} = require('../../src/utils/helpers');

describe('Helper Utilities', () => {
  describe('isValidEmail', () => {
    it('should validate correct email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });
  });

  describe('maskString', () => {
    it('should mask string correctly', () => {
      expect(maskString('1234567890', 4)).toBe('******7890');
      expect(maskString('test@email.com', 4)).toBe('**********l.com');
    });

    it('should handle short strings', () => {
      expect(maskString('abc', 4)).toBe('abc');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
    });
  });

  describe('sanitizeObject', () => {
    it('should remove null and undefined values', () => {
      const input = {
        name: 'John',
        age: null,
        email: 'john@example.com',
        phone: undefined,
      };

      const result = sanitizeObject(input);

      expect(result).toEqual({
        name: 'John',
        email: 'john@example.com',
      });
    });
  });
});
