const { describe, it, expect } = require('./test-utils');

module.exports = {
  name: 'Test Suite Template',
  tests: [
    describe('Example Test Suite', [
      it('should pass this test', () => {
        expect(true).toBe(true);
      }),
      
      it('should fail this test', () => {
        expect(false).toBe(true);
      }),
      
      it('should handle async operations', async () => {
        const result = await Promise.resolve(true);
        expect(result).toBe(true);
      })
    ])
  ]
}; 