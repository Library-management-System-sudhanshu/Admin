const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

const source = fs.readFileSync('src/utils/validators.ts', 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});

const moduleExports = {};
const fn = new Function('exports', outputText);
fn(moduleExports);

const {
  isValidEmail,
  isValidIndianMobile,
  isValidPincode,
  isValidAadhar,
  validateName,
  validateEmail,
  validateMobile,
  validatePincode,
} = moduleExports;

describe('validators unit tests', () => {
  test('isValidEmail checks valid and invalid email addresses', () => {
    assert.equal(isValidEmail('admin@test.com'), true);
    assert.equal(isValidEmail('user.name+tag@domain.co.in'), true);
    assert.equal(isValidEmail('invalid-email'), false);
    assert.equal(isValidEmail('@domain.com'), false);
    assert.equal(isValidEmail(''), false);
  });

  test('isValidIndianMobile validates 10-digit Indian numbers', () => {
    assert.equal(isValidIndianMobile('9876543210'), true);
    assert.equal(isValidIndianMobile('6123456789'), true);
    // Invalid (starts with 5 or has wrong length)
    assert.equal(isValidIndianMobile('5876543210'), false);
    assert.equal(isValidIndianMobile('987654321'), false);
    assert.equal(isValidIndianMobile('98765432100'), false);
  });

  test('isValidPincode validates 6 digit codes', () => {
    assert.equal(isValidPincode('221005'), true);
    assert.equal(isValidPincode('110001'), true);
    assert.equal(isValidPincode('11000'), false);
    assert.equal(isValidPincode('abcdef'), false);
  });

  test('isValidAadhar validates 12 digit numbers', () => {
    assert.equal(isValidAadhar('123456789012'), true);
    assert.equal(isValidAadhar('1234 5678 9012'), true);
    assert.equal(isValidAadhar('12345678901'), false);
  });

  test('validateName checks length and presence', () => {
    assert.equal(validateName(''), 'Name is required');
    assert.equal(validateName('A'), 'Name must be at least 2 characters');
    assert.equal(validateName('John Doe'), null);
  });

  test('validateEmail handles optional and required modes', () => {
    assert.equal(validateEmail('', true), 'Email is required');
    assert.equal(validateEmail('', false), null);
    assert.equal(validateEmail('bad'), 'Invalid email address');
    assert.equal(validateEmail('good@email.com'), null);
  });

  test('validateMobile handles format checking', () => {
    assert.equal(validateMobile('', true), 'Mobile number is required');
    assert.equal(validateMobile('12345'), 'Must be a valid 10-digit mobile number starting with 6-9');
    assert.equal(validateMobile('9876543210'), null);
  });
});
