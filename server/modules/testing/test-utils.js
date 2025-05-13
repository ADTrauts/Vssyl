class TestSuite {
  constructor(name) {
    this.name = name;
    this.tests = [];
  }

  addTest(name, testFunction) {
    this.tests.push({
      name,
      run: testFunction
    });
  }

  async run(module) {
    const results = [];
    for (const test of this.tests) {
      try {
        const result = await test.run(module);
        results.push({
          name: test.name,
          status: 'passed',
          result
        });
      } catch (error) {
        results.push({
          name: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
    return results;
  }
}

class TestCase {
  constructor(name, testFunction) {
    this.name = name;
    this.run = testFunction;
  }
}

class AssertionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AssertionError';
  }
}

const assert = {
  equal(actual, expected, message) {
    if (actual !== expected) {
      throw new AssertionError(message || `Expected ${expected}, but got ${actual}`);
    }
  },

  notEqual(actual, expected, message) {
    if (actual === expected) {
      throw new AssertionError(message || `Expected not ${expected}, but got ${actual}`);
    }
  },

  isTrue(value, message) {
    if (value !== true) {
      throw new AssertionError(message || `Expected true, but got ${value}`);
    }
  },

  isFalse(value, message) {
    if (value !== false) {
      throw new AssertionError(message || `Expected false, but got ${value}`);
    }
  },

  isNull(value, message) {
    if (value !== null) {
      throw new AssertionError(message || `Expected null, but got ${value}`);
    }
  },

  isNotNull(value, message) {
    if (value === null) {
      throw new AssertionError(message || `Expected not null, but got null`);
    }
  },

  async throws(fn, errorType, message) {
    try {
      await fn();
      throw new AssertionError(message || 'Expected function to throw an error');
    } catch (error) {
      if (errorType && !(error instanceof errorType)) {
        throw new AssertionError(message || `Expected error of type ${errorType.name}, but got ${error.constructor.name}`);
      }
    }
  },

  async doesNotThrow(fn, message) {
    try {
      await fn();
    } catch (error) {
      throw new AssertionError(message || `Expected function not to throw, but got ${error.message}`);
    }
  }
};

// Test suite utilities
const describe = (name, tests) => ({
  name,
  tests,
  type: 'suite'
});

const it = (name, testFn) => ({
  name,
  testFn,
  type: 'test'
});

// Assertion utilities
class Expectation {
  constructor(actual) {
    this.actual = actual;
  }

  toBe(expected) {
    if (this.actual !== expected) {
      throw new Error(`Expected ${this.actual} to be ${expected}`);
    }
  }

  toEqual(expected) {
    if (JSON.stringify(this.actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(this.actual)} to equal ${JSON.stringify(expected)}`);
    }
  }

  toBeTruthy() {
    if (!this.actual) {
      throw new Error(`Expected ${this.actual} to be truthy`);
    }
  }

  toBeFalsy() {
    if (this.actual) {
      throw new Error(`Expected ${this.actual} to be falsy`);
    }
  }

  toBeInstanceOf(constructor) {
    if (!(this.actual instanceof constructor)) {
      throw new Error(`Expected ${this.actual} to be instance of ${constructor.name}`);
    }
  }

  toThrow(expectedError) {
    if (typeof this.actual !== 'function') {
      throw new Error('Expected a function to test for thrown error');
    }

    try {
      this.actual();
      throw new Error('Expected function to throw an error');
    } catch (error) {
      if (expectedError && error.message !== expectedError) {
        throw new Error(`Expected error message "${expectedError}" but got "${error.message}"`);
      }
    }
  }
}

const expect = (actual) => new Expectation(actual);

module.exports = {
  TestSuite,
  TestCase,
  assert,
  describe,
  it,
  expect
}; 