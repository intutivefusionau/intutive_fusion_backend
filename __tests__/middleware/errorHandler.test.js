const { formatValidationErrors } = require('../../src/middleware/errorHandler');

describe('Error Handler Utilities', () => {
  describe('formatValidationErrors', () => {
    it('should format validation errors correctly', () => {
      const mockErrors = {
        array: () => [
          {
            path: 'email',
            msg: 'Invalid email',
            value: 'invalid',
          },
          {
            param: 'password',
            msg: 'Password too short',
            value: '123',
          },
        ],
      };

      const formatted = formatValidationErrors(mockErrors);

      expect(formatted).toHaveLength(2);
      expect(formatted[0]).toHaveProperty('field', 'email');
      expect(formatted[0]).toHaveProperty('message', 'Invalid email');
      expect(formatted[1]).toHaveProperty('field', 'password');
    });
  });
});
