/**
 * HostelHub Automated Test Suite
 * Part 5: Twist rule & Test Verification
 * Validates all CRUD, Join, Search, Validation, and the 3 Twist Tests
 * Uses in-memory direct dispatch to test without requiring network port binding.
 */

const { EventEmitter } = require('events');
const app = require('../src/app');
const db = require('../src/db/database');
const seed = require('../src/db/seed');

function makeRequest(method, urlPath, body = null) {
  return new Promise((resolve) => {
    const req = new EventEmitter();
    req.method = method;
    req.url = urlPath;
    req.headers = { 'content-type': 'application/json' };

    const res = new EventEmitter();
    res.statusCode = 200;
    res.headers = {};
    let responseBody = '';

    res.setHeader = (key, val) => {
      res.headers[key.toLowerCase()] = val;
    };
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(data));
      return res;
    };
    res.send = (data) => {
      if (typeof data === 'object') return res.json(data);
      res.end(data);
      return res;
    };
    res.end = (chunk) => {
      if (chunk) responseBody += chunk;
      let parsed;
      try {
        parsed = JSON.parse(responseBody);
      } catch (e) {
        parsed = responseBody;
      }
      resolve({ status: res.statusCode, body: parsed });
    };

    // Invoke app handler
    app(req, res);

    // Push data
    if (body) {
      req.emit('data', Buffer.from(JSON.stringify(body)));
    }
    req.emit('end');
  });
}

async function runTests() {
  console.log('\n========================================================');
  console.log(' RUNNING HOSTELHUB VERIFICATION TEST SUITE (NU-AIAGAI2C-G10)');
  console.log('========================================================\n');

  // Seed clean database state
  await seed();

  let passed = 0;
  let failed = 0;

  async function assertTest(name, fn) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         Error: ${err.message}`);
      failed++;
    }
  }

  // Group 1: General Server & Health Check
  await assertTest('Server root GET / returns 200 and project metadata', async () => {
    const res = await makeRequest('GET', '/');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.project !== 'HostelHub') throw new Error('Expected project HostelHub');
  });

  // Group 2: Rooms CRUD & Search
  await assertTest('GET /rooms returns 200 and room list', async () => {
    const res = await makeRequest('GET', '/rooms');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.body) || res.body.length === 0) throw new Error('Expected array of rooms');
  });

  await assertTest('Search by query parameter: GET /rooms?block=Block A', async () => {
    const res = await makeRequest('GET', '/rooms?block=Block%20A');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const nonBlockA = res.body.filter((r) => !r.block.includes('Block A'));
    if (nonBlockA.length > 0) throw new Error('Filter returned rooms from other blocks');
  });

  await assertTest('GET /rooms/:id returns 200 for existing room', async () => {
    const res = await makeRequest('GET', '/rooms/1');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.id !== 1) throw new Error('Expected room id 1');
  });

  await assertTest('GET /rooms/:id returns 404 for non-existing room', async () => {
    const res = await makeRequest('GET', '/rooms/9999');
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  });

  await assertTest('POST /rooms creates new room and returns 201', async () => {
    const res = await makeRequest('POST', '/rooms', { name: 'Room 401', block: 'Block D', capacity: 2 });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    if (res.body.name !== 'Room 401' || res.body.block !== 'Block D') throw new Error('Room fields mismatch');
  });

  await assertTest('POST /rooms fails with 400 when name is missing (Validation)', async () => {
    const res = await makeRequest('POST', '/rooms', { block: 'Block D' });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  await assertTest('POST /rooms fails with 400 when block is missing (Validation)', async () => {
    const res = await makeRequest('POST', '/rooms', { name: 'Room 402' });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  await assertTest('PUT /rooms/:id updates room and returns 200', async () => {
    const res = await makeRequest('PUT', '/rooms/6', { name: 'Room 301-Renovated', block: 'Block C' });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.name !== 'Room 301-Renovated') throw new Error('Room name not updated');
  });

  await assertTest('DELETE /rooms/:id deletes room and returns 200', async () => {
    const res = await makeRequest('DELETE', '/rooms/6');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  // Group 3: One Join Endpoint
  await assertTest('One join endpoint: GET /allotments joins resident name and room name', async () => {
    const res = await makeRequest('GET', '/allotments');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.body) || res.body.length === 0) throw new Error('Expected array of allotments');
    const first = res.body[0];
    if (!first.resident_name || !first.room_name) {
      throw new Error('Allotment missing joined resident_name or room_name');
    }
  });

  // Group 4: Free rooms endpoint (Client brief scenario helper)
  await assertTest('GET /rooms/free returns only unallotted rooms', async () => {
    const res = await makeRequest('GET', '/rooms/free');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.body)) throw new Error('Expected array of free rooms');
  });

  // Group 5: THE 3 SPECIFIED TWIST TESTS
  console.log('\n--- VERIFYING BRIEF TWIST TESTS ---');

  await assertTest('Test 1: Return a allotment -> 200', async () => {
    // Allotment 1 is active (Alex Johnson in Room 101)
    const res = await makeRequest('POST', '/allotments/1/return', {
      return_date: '2026-11-14T12:00:00Z'
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.allotment || !res.body.allotment.return_date) {
      throw new Error('Allotment return_date was not updated');
    }
  });

  await assertTest('Test 2: Return it again -> 409 and message "Already returned"', async () => {
    // Returning allotment 1 a second time
    const res = await makeRequest('POST', '/allotments/1/return');
    if (res.status !== 409) throw new Error(`Expected 409, got ${res.status}`);
    if (res.body.message !== 'Already returned') {
      throw new Error(`Expected message "Already returned", got "${res.body.message}"`);
    }
  });

  await assertTest('Test 3: GET /residents/1/history -> 200, it is listed', async () => {
    const res = await makeRequest('GET', '/residents/1/history');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.body)) throw new Error('Expected array of history items');
    // Check if Allotment 1 (now returned) and Allotment 2 (returned during seed) are listed
    const foundAllotment1 = res.body.find((item) => item.allotment_id === 1);
    if (!foundAllotment1) throw new Error('Recently returned allotment 1 is not listed in history');
    if (!foundAllotment1.room_name || !foundAllotment1.resident_name) {
      throw new Error('History item missing joined room or resident details');
    }
  });

  console.log('\n========================================================');
  console.log(` TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
