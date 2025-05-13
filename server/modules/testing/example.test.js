const { describe, it, expect } = require('./test-utils');

// Example class to test
class Calculator {
  add(a, b) {
    return a + b;
  }

  subtract(a, b) {
    return a - b;
  }

  multiply(a, b) {
    return a * b;
  }

  divide(a, b) {
    if (b === 0) {
      throw new Error('Division by zero');
    }
    return a / b;
  }
}

module.exports = {
  name: 'Calculator Tests',
  tests: [
    describe('Calculator', [
      it('should add two numbers correctly', () => {
        const calc = new Calculator();
        expect(calc.add(2, 3)).toBe(5);
      }),

      it('should subtract two numbers correctly', () => {
        const calc = new Calculator();
        expect(calc.subtract(5, 3)).toBe(2);
      }),

      it('should multiply two numbers correctly', () => {
        const calc = new Calculator();
        expect(calc.multiply(4, 3)).toBe(12);
      }),

      it('should divide two numbers correctly', () => {
        const calc = new Calculator();
        expect(calc.divide(6, 2)).toBe(3);
      }),

      it('should throw error when dividing by zero', () => {
        const calc = new Calculator();
        expect(() => calc.divide(6, 0)).toThrow('Division by zero');
      })
    ])
  ]
}; 