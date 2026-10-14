const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

// Transpile dateUtils.ts on the fly
const source = fs.readFileSync('src/utils/dateUtils.ts', 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});

const moduleExports = {};
const fn = new Function('exports', outputText);
fn(moduleExports);

const {
  formatYYYYMMDD,
  getTodayYYYYMMDD,
  formatDateDisplay,
  addMonthsToDate,
  addDaysToDate,
  formatTo12hString,
  calculateShiftDuration,
} = moduleExports;

describe('dateUtils unit tests', () => {
  test('formatYYYYMMDD formats strings, Dates, and invalid inputs', () => {
    assert.equal(formatYYYYMMDD('2026-07-15T10:30:00Z'), '2026-07-15');
    assert.equal(formatYYYYMMDD('2026-07-15'), '2026-07-15');
    assert.equal(formatYYYYMMDD(new Date(2026, 6, 15)), '2026-07-15');
    assert.equal(formatYYYYMMDD(null), '');
    assert.equal(formatYYYYMMDD(undefined), '');
    assert.equal(formatYYYYMMDD('not-a-date'), '');
  });

  test('getTodayYYYYMMDD returns valid format', () => {
    const today = getTodayYYYYMMDD();
    assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
  });

  test('formatDateDisplay formats human-readable date and handles fallbacks', () => {
    assert.equal(formatDateDisplay('2026-07-15'), 'Jul 15, 2026');
    assert.equal(formatDateDisplay(null), 'N/A');
    assert.equal(formatDateDisplay('', 'Unknown'), 'Unknown');
  });

  test('addDaysToDate adds days correctly across month boundaries', () => {
    assert.equal(addDaysToDate('2026-01-30', 3), '2026-02-02');
    assert.equal(addDaysToDate('2026-03-01', 5), '2026-03-06');
    assert.equal(addDaysToDate('', 5), '');
  });

  test('addMonthsToDate adds months correctly across year boundaries', () => {
    assert.equal(addMonthsToDate('2026-05-15', 2), '2026-07-15');
    assert.equal(addMonthsToDate('2026-11-15', 3), '2027-02-15');
    assert.equal(addMonthsToDate('', 1), '');
  });

  test('formatTo12hString converts 24h to 12h with AM/PM', () => {
    assert.equal(formatTo12hString('00:00'), '12:00 AM');
    assert.equal(formatTo12hString('09:15'), '09:15 AM');
    assert.equal(formatTo12hString('12:00'), '12:00 PM');
    assert.equal(formatTo12hString('14:30'), '02:30 PM');
    assert.equal(formatTo12hString('23:59'), '11:59 PM');
    assert.equal(formatTo12hString(''), '');
  });

  test('calculateShiftDuration handles daytime and overnight shifts', () => {
    assert.equal(calculateShiftDuration('09:00', '17:00'), '8 hr');
    assert.equal(calculateShiftDuration('08:00', '13:30'), '5 hr 30m');
    // Overnight shift crossing midnight
    assert.equal(calculateShiftDuration('22:00', '06:00'), '8 hr');
    assert.equal(calculateShiftDuration('23:00', '05:45'), '6 hr 45m');
    assert.equal(calculateShiftDuration('', '05:00'), '');
  });
});
