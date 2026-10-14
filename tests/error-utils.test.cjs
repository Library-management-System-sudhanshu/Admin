const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

const source = fs.readFileSync('src/utils/errorUtils.ts', 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});

const moduleExports = {};
const fn = new Function('exports', outputText);
fn(moduleExports);

const { getErrorMessage, isUnauthorizedError, isForbiddenError } = moduleExports;

describe('errorUtils unit tests', () => {
  test('extracts error from RTK Query api error payload', () => {
    const error = { status: 400, data: { message: 'Invalid phone number' } };
    assert.equal(getErrorMessage(error), 'Invalid phone number');
  });

  test('extracts nested validation error map', () => {
    const error = { status: 422, data: { errors: { email: ['Email already in use'] } } };
    assert.equal(getErrorMessage(error), 'Email already in use');
  });

  test('extracts message from standard Error instances', () => {
    const error = new Error('Network timeout');
    assert.equal(getErrorMessage(error), 'Network timeout');
  });

  test('falls back gracefully on empty or unknown error', () => {
    assert.equal(getErrorMessage(null), 'An unexpected error occurred. Please try again.');
    assert.equal(getErrorMessage({}, 'Custom fallback'), 'Custom fallback');
  });

  test('identifies HTTP 401 and 403 status codes correctly', () => {
    assert.equal(isUnauthorizedError({ status: 401 }), true);
    assert.equal(isUnauthorizedError({ status: 200 }), false);
    assert.equal(isForbiddenError({ status: 403 }), true);
    assert.equal(isForbiddenError({ status: 401 }), false);
  });
});
