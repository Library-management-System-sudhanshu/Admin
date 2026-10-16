const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

const source = fs.readFileSync('src/utils/seatUtils.ts', 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});

const moduleExports = {};
const fn = new Function('exports', outputText);
fn(moduleExports);

const { getDaysRemainingText, getSeatStatusInfo } = moduleExports;

describe('seatUtils unit tests', () => {
  test('getDaysRemainingText handles null, empty, and invalid dates', () => {
    assert.equal(getDaysRemainingText(null), 'No end date');
    assert.equal(getDaysRemainingText(''), 'No end date');
    assert.equal(getDaysRemainingText('invalid-date'), 'Invalid date');
  });

  test('getDaysRemainingText calculates remaining days correctly', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 10);
    const futureIso = futureDate.toISOString();
    assert.equal(getDaysRemainingText(futureIso), '10 days remaining');

    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 5);
    const pastIso = pastDate.toISOString();
    assert.equal(getDaysRemainingText(pastIso), 'Expired');

    const todayIso = today.toISOString();
    assert.equal(getDaysRemainingText(todayIso), 'Ends today');
  });

  test('getSeatStatusInfo handles empty or null seats', () => {
    const info = getSeatStatusInfo(null);
    assert.equal(info.isOccupied, false);
    assert.equal(info.isExpired, false);
    assert.equal(info.activeAllocations.length, 0);
  });

  test('getSeatStatusInfo distinguishes occupied vs expired allocations', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);

    // Active & Current
    const occupiedSeat = {
      allocations: [
        { id: '1', isActive: true, endDate: futureDate.toISOString() },
      ],
    };
    const occupiedInfo = getSeatStatusInfo(occupiedSeat);
    assert.equal(occupiedInfo.isOccupied, true);
    assert.equal(occupiedInfo.isExpired, false);
    assert.equal(occupiedInfo.currentAllocations.length, 1);

    // Active & Expired
    const expiredSeat = {
      allocations: [
        { id: '2', isActive: true, endDate: pastDate.toISOString() },
      ],
    };
    const expiredInfo = getSeatStatusInfo(expiredSeat);
    assert.equal(expiredInfo.isOccupied, false);
    assert.equal(expiredInfo.isExpired, true);
    assert.equal(expiredInfo.expiredAllocations.length, 1);
  });

  test('getSeatStatusInfo ignores allocations where studentProfile is null or deleted', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);

    // Allocation where student was soft-deleted (Sequelize sets studentProfile to null)
    const orphanedSeatNull = {
      allocations: [
        { id: '1', isActive: true, endDate: futureDate.toISOString(), studentProfile: null },
      ],
    };
    const nullInfo = getSeatStatusInfo(orphanedSeatNull);
    assert.equal(nullInfo.isOccupied, false);
    assert.equal(nullInfo.activeAllocations.length, 0);

    // Allocation where studentProfile has deletedAt timestamp
    const orphanedSeatDeleted = {
      allocations: [
        {
          id: '2',
          isActive: true,
          endDate: futureDate.toISOString(),
          studentProfile: { id: 's1', name: 'Deleted Student', deletedAt: '2026-10-14T11:23:00Z' },
        },
      ],
    };
    const deletedInfo = getSeatStatusInfo(orphanedSeatDeleted);
    assert.equal(deletedInfo.isOccupied, false);
    assert.equal(deletedInfo.activeAllocations.length, 0);

    // Valid student allocation
    const validSeat = {
      allocations: [
        {
          id: '3',
          isActive: true,
          endDate: futureDate.toISOString(),
          studentProfile: { id: 's2', name: 'Active Student', deletedAt: null },
        },
      ],
    };
    const validInfo = getSeatStatusInfo(validSeat);
    assert.equal(validInfo.isOccupied, true);
    assert.equal(validInfo.activeAllocations.length, 1);
  });
});
