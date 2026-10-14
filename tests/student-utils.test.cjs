const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

const tsSource = fs.readFileSync('src/utils/studentUtils.ts', 'utf8');
const jsSource = ts.transpileModule(tsSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

const studentUtils = {};
const moduleExports = { exports: studentUtils };
const fn = new Function('module', 'exports', jsSource);
fn(moduleExports, studentUtils);

const {
  getStudentDisplayName,
  getStudentInitials,
  getStudentEmail,
  getStudentMobile,
  getStudentBranchName,
} = moduleExports.exports;

test('studentUtils unit tests', async (t) => {
  await t.test('resolves display name when user.name exists', () => {
    const student = { user: { name: 'Aarav Sharma' } };
    assert.equal(getStudentDisplayName(student), 'Aarav Sharma');
    assert.equal(getStudentInitials(student), 'AS');
  });

  await t.test('falls back gracefully when user.name and displayName are null', () => {
    const student = {
      id: '8e7979ec-3690-4936-94c3-6fb5ebfa41ef',
      displayName: null,
      user: { name: null, email: null, mobile: null },
    };
    assert.equal(getStudentDisplayName(student), 'Student (8E7979)');
    assert.equal(getStudentInitials(student), 'S');
    assert.equal(getStudentEmail(student), 'N/A');
    assert.equal(getStudentMobile(student), 'N/A');
  });

  await t.test('resolves contactEmail and contactMobile if user fields are null', () => {
    const student = {
      displayName: 'Rahul Dravid',
      contactEmail: 'rahul@example.com',
      contactMobile: '9876543210',
      user: { name: null, email: null, mobile: null },
    };
    assert.equal(getStudentDisplayName(student), 'Rahul Dravid');
    assert.equal(getStudentEmail(student), 'rahul@example.com');
    assert.equal(getStudentMobile(student), '9876543210');
  });

  await t.test('resolves branch name from branches array using branchId', () => {
    const student = {
      branchId: 'b-101',
    };
    const branches = [
      { id: 'b-100', name: 'West Branch' },
      { id: 'b-101', name: 'North Branch' },
    ];
    assert.equal(getStudentBranchName(student, branches), 'North Branch');
  });

  await t.test('falls back to Main Branch if branchId not found', () => {
    const student = { branchId: 'unknown' };
    assert.equal(getStudentBranchName(student, []), 'Main Branch');
  });
});
