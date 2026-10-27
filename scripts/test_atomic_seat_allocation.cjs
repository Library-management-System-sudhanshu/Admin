const fs = require('fs');
const http = require('http');
const pg = require('/Users/sudhanshukumar/Desktop/Backend-code/node_modules/pg');
const jwt = require('/Users/sudhanshukumar/Desktop/Backend-code/node_modules/jsonwebtoken');

// 1. Read .env
const envFile = fs.readFileSync('/Users/sudhanshukumar/Desktop/Backend-code/.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1]] = val;
  }
});

const pool = new pg.Pool({ connectionString: env.DATABASE_URL });

function apiRequest(method, path, body, token, workspaceId) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Length': Buffer.byteLength(postData),
    };
    if (workspaceId) headers['X-Workspace-Id'] = workspaceId;
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api' + path,
      method: method,
      headers: headers,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runTest() {
  console.log('--- ATOMIC SEAT ALLOCATION & TRANSACTION ROLLBACK TEST ---');
  const client = await pool.connect();
  try {
    // Find an owner or manager user
    const userRes = await client.query(`
      SELECT u.id, u.email, u.role, u."workspaceId" 
      FROM "users" u 
      WHERE u.role IN ('OWNER', 'MANAGER') 
      LIMIT 1
    `);
    if (userRes.rows.length === 0) throw new Error('No owner/manager user found');
    const adminUser = userRes.rows[0];

    // Find an approved student in this workspace
    const studentRes = await client.query(`
      SELECT sp.id, sp."userId", sp."branchId", sp."workspaceId" 
      FROM "student_profiles" sp 
      WHERE sp."workspaceId" = $1 AND sp.status = 'APPROVED' 
      LIMIT 1
    `, [adminUser.workspaceId]);
    if (studentRes.rows.length === 0) throw new Error('No approved student found');
    const student = studentRes.rows[0];

    // Find a base shift in this workspace
    const shiftRes = await client.query(`
      SELECT id, name, price 
      FROM "shifts" 
      WHERE "workspaceId" = $1 AND type = 'BASE' 
      LIMIT 1
    `, [adminUser.workspaceId]);
    if (shiftRes.rows.length === 0) throw new Error('No base shift found');
    const shift = shiftRes.rows[0];

    // Find an available seat in the student's branch
    const seatRes = await client.query(`
      SELECT s.id, s.number, s.status 
      FROM "seats" s
      JOIN "rooms" r ON s."roomId" = r.id
      JOIN "floors" f ON r."floorId" = f.id
      WHERE f."branchId" = $1 AND s.status = 'AVAILABLE'
      LIMIT 1
    `, [student.branchId]);
    if (seatRes.rows.length === 0) throw new Error('No available seat found in branch');
    const seat = seatRes.rows[0];

    console.log(`User: ${adminUser.email} (Role: ${adminUser.role})`);
    console.log(`Student ID: ${student.id}`);
    console.log(`Seat: ${seat.number} (ID: ${seat.id}, Initial Status: ${seat.status})`);
    console.log(`Shift: ${shift.name} (ID: ${shift.id}, Price: ${shift.price})`);

    // Generate JWT token with sub
    const token = jwt.sign(
      {
        sub: adminUser.id,
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        workspaceId: adminUser.workspaceId,
        tokenUse: 'access',
      },
      env.JWT_SECRET,
      { expiresIn: '1h', algorithm: 'HS256' }
    );

    // Initial counts
    const allocCountBefore = (await client.query(
      `SELECT count(*) FROM "seat_allocations" WHERE "seatId" = $1 AND "isActive" = true`,
      [seat.id]
    )).rows[0].count;

    const paymentCountBefore = (await client.query(
      `SELECT count(*) FROM "payments" WHERE "studentProfileId" = $1`,
      [student.id]
    )).rows[0].count;

    console.log(`\nInitial State:`);
    console.log(`- Seat status: ${seat.status}`);
    console.log(`- Active seat allocations on this seat: ${allocCountBefore}`);
    console.log(`- Student payments: ${paymentCountBefore}`);

    // --- TEST 1: FAILING PAYMENT (ROLLBACK TEST) ---
    console.log('\n--- Step 1: Testing atomic rollback with invalid payment ---');
    const today = new Date().toISOString();
    const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString();

    const badPayload = {
      studentProfileId: student.id,
      seatId: seat.id,
      shiftId: shift.id,
      startDate: today,
      endDate: nextMonth,
      payment: {
        amount: 999999, // Exceeds total amount!
        totalAmount: 500,
        method: 'CASH',
        shiftId: shift.id,
      },
    };

    const failResponse = await apiRequest('POST', '/seats/allocate', badPayload, token, adminUser.workspaceId);
    console.log(`Response HTTP Status: ${failResponse.status}`);
    console.log(`Response Message: ${failResponse.body.message || JSON.stringify(failResponse.body)}`);

    if (failResponse.status !== 400) {
      throw new Error(`Expected HTTP 400, received ${failResponse.status}`);
    }

    // Check DB state after failed transaction
    const seatAfterFail = (await client.query(
      `SELECT status FROM "seats" WHERE id = $1`,
      [seat.id]
    )).rows[0];

    const allocCountAfterFail = (await client.query(
      `SELECT count(*) FROM "seat_allocations" WHERE "seatId" = $1 AND "isActive" = true`,
      [seat.id]
    )).rows[0].count;

    const paymentCountAfterFail = (await client.query(
      `SELECT count(*) FROM "payments" WHERE "studentProfileId" = $1`,
      [student.id]
    )).rows[0].count;

    console.log(`\nState after failed allocation:`);
    console.log(`- Seat status: ${seatAfterFail.status} (Expected: AVAILABLE)`);
    console.log(`- Active allocations: ${allocCountAfterFail} (Expected: ${allocCountBefore})`);
    console.log(`- Payments: ${paymentCountAfterFail} (Expected: ${paymentCountBefore})`);

    if (seatAfterFail.status !== 'AVAILABLE') {
      throw new Error(`ROLLBACK FAILED! Seat status was modified to ${seatAfterFail.status}`);
    }
    if (allocCountAfterFail !== allocCountBefore) {
      throw new Error(`ROLLBACK FAILED! SeatAllocation was created and not rolled back!`);
    }
    if (paymentCountAfterFail !== paymentCountBefore) {
      throw new Error(`ROLLBACK FAILED! Payment count changed!`);
    }

    console.log('>>> PASSED: Entire database transaction rolled back cleanly! No changes were committed.');

    // --- TEST 2: SUCCESSFUL ATOMIC ALLOCATION WITH PAYMENT ---
    console.log('\n--- Step 2: Testing successful atomic allocation with valid payment ---');
    const goodPayload = {
      studentProfileId: student.id,
      seatId: seat.id,
      shiftId: shift.id,
      startDate: today,
      endDate: nextMonth,
      payment: {
        amount: 500,
        totalAmount: 500,
        method: 'CASH',
        shiftId: shift.id,
      },
    };

    const successResponse = await apiRequest('POST', '/seats/allocate', goodPayload, token, adminUser.workspaceId);
    console.log(`Response HTTP Status: ${successResponse.status}`);
    console.log(`Allocated Seat ID: ${successResponse.body.seatId || successResponse.body.id}`);
    console.log(`Payment Record ID: ${successResponse.body.payment ? successResponse.body.payment.id : 'N/A'}`);
    console.log(`Payment Status: ${successResponse.body.payment ? successResponse.body.payment.status : 'N/A'}`);

    if (successResponse.status !== 201) {
      throw new Error(`Expected HTTP 201, received ${successResponse.status}: ${JSON.stringify(successResponse.body)}`);
    }

    const seatAfterSuccess = (await client.query(
      `SELECT status FROM "seats" WHERE id = $1`,
      [seat.id]
    )).rows[0];

    const allocCountAfterSuccess = (await client.query(
      `SELECT count(*) FROM "seat_allocations" WHERE "seatId" = $1 AND "isActive" = true`,
      [seat.id]
    )).rows[0].count;

    console.log(`\nState after successful atomic allocation:`);
    console.log(`- Seat status: ${seatAfterSuccess.status} (Expected: OCCUPIED)`);
    console.log(`- Active allocations: ${allocCountAfterSuccess} (Expected: 1)`);

    if (seatAfterSuccess.status !== 'OCCUPIED' || allocCountAfterSuccess !== '1') {
      throw new Error(`Atomic success verification failed!`);
    }

    console.log('>>> PASSED: Seat allocated and payment settled together atomically in single transaction!');

    // --- CLEANUP ---
    console.log('\n--- Step 3: Cleaning up test data ---');
    // Delete the test allocation and payment
    if (successResponse.body.payment) {
      await client.query(`DELETE FROM "payments" WHERE id = $1`, [successResponse.body.payment.id]);
    }
    await client.query(`DELETE FROM "seat_allocations" WHERE "seatId" = $1 AND "studentProfileId" = $2`, [seat.id, student.id]);
    await client.query(`UPDATE "seats" SET status = 'AVAILABLE' WHERE id = $1`, [seat.id]);
    console.log('Cleaned up test allocation and restored seat to AVAILABLE.');

    console.log('\n===========================================');
    console.log('ALL TESTS PASSED! ATOMIC ROLLBACK CONFIRMED');
    console.log('===========================================');
  } finally {
    client.release();
    await pool.end();
  }
}

runTest().catch(err => {
  console.error('\nTEST FAILED WITH ERROR:', err);
  process.exit(1);
});
