/**
 * ============================================================================
 * HostelHub - Room Allotment Backend System
 * Group Code: NU-AIAGAI2C-G10 | Theme 10 of 30: Room Allotment
 * Course: Backend Development Fundamentals (Modules 1 to 3)
 *
 * ALL-IN-ONE SINGLE FOLDER ARCHITECTURE:
 * - Part 1: Server and routes (Express setup, routes, status codes)
 * - Part 2: Database (3 tables: residents, rooms, allotments and queries)
 * - Part 3: REST endpoints (CRUD for rooms and the mandatory JOIN endpoint)
 * - Part 4: Validation and search (Input checks, messages, search by query)
 * - Part 5: Twist rule (Return flow: 409 "Already returned", resident history)
 * ============================================================================
 */

const http = require('http');
const path = require('path');
const url = require('url');

// ============================================================================
// PART 1: SERVER & EXPRESS SETUP
// ============================================================================

// Attempt loading standard 'express', or smoothly fallback to built-in mini-engine
let express;
try {
  express = require('express');
} catch (e) {
  // Built-in Express compatibility engine using Node.js 'http' module
  function createRouter() {
    const stack = [];
    function normalizePath(p) { return (!p || p === '/') ? '/' : p.replace(/\/+$/, ''); }
    function pathToRegex(p) {
      const norm = normalizePath(p);
      if (norm === '/') return /^\/?$/;
      const pattern = norm.replace(/\/:([a-zA-Z0-9_]+)/g, '/([^/]+)').replace(/\//g, '\\/');
      return new RegExp(`^${pattern}\\/?$`);
    }
    function pathToKeys(p) { return (p.match(/:([a-zA-Z0-9_]+)/g) || []).map(m => m.substring(1)); }

    function use(...args) {
      if (args.length === 1 && typeof args[0] === 'function') {
        stack.push({ type: 'middleware', path: '', fn: args[0] });
      } else if (args.length === 2 && typeof args[1] === 'function') {
        stack.push({ type: 'middleware', path: normalizePath(args[0]), fn: args[1] });
      }
    }

    function addRoute(method, routePath, ...handlers) {
      stack.push({
        type: 'route',
        method: method.toUpperCase(),
        path: routePath,
        regex: pathToRegex(routePath),
        keys: pathToKeys(routePath),
        handlers
      });
    }

    return {
      stack,
      use,
      get: (p, ...h) => addRoute('GET', p, ...h),
      post: (p, ...h) => addRoute('POST', p, ...h),
      put: (p, ...h) => addRoute('PUT', p, ...h),
      delete: (p, ...h) => addRoute('DELETE', p, ...h)
    };
  }

  express = function () {
    const router = createRouter();
    const appInstance = function (req, res) { handleReq(req, res, router); };
    Object.assign(appInstance, router);
    appInstance.listen = function (port, cb) {
      const server = http.createServer((req, res) => handleReq(req, res, router));
      return server.listen(port, cb);
    };
    return appInstance;
  };

  express.json = function () {
    return function (req, res, next) { next(); };
  };

  function handleReq(req, res, router) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname || '/';
    req.query = parsedUrl.query || {};
    req.params = {};

    res.status = function (code) { res.statusCode = code; return res; };
    res.json = function (data) {
      if (!res.headersSent) res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
      return res;
    };
    res.send = function (data) {
      if (typeof data === 'object') return res.json(data);
      if (!res.headersSent) res.setHeader('Content-Type', 'text/html');
      res.end(data);
      return res;
    };

    let bodyBuffer = '';
    req.on('data', chunk => { bodyBuffer += chunk.toString(); });
    req.on('end', async () => {
      req.body = {};
      if (bodyBuffer) {
        try { req.body = JSON.parse(bodyBuffer); } catch (e) { req.body = bodyBuffer; }
      }

      const method = req.method.toUpperCase();
      let index = 0;

      async function next(err) {
        if (err) return res.status(500).json({ error: 'Internal Server Error', message: err.message });
        if (index >= router.stack.length) {
          if (!res.headersSent) res.status(404).json({ error: 'Not Found', message: `Cannot ${method} ${pathname}` });
          return;
        }

        const item = router.stack[index++];
        if (item.type === 'middleware') {
          const matches = !item.path || pathname === item.path || pathname.startsWith(item.path + '/');
          if (matches) {
            try { return item.fn(req, res, next); } catch (e) { return next(e); }
          }
          return next();
        }

        if (item.type === 'route') {
          if (item.method === method) {
            const match = pathname.match(item.regex);
            if (match) {
              req.params = {};
              item.keys.forEach((key, i) => { req.params[key] = decodeURIComponent(match[i + 1]); });
              let hIdx = 0;
              function runHandler() {
                if (hIdx >= item.handlers.length) return next();
                const handler = item.handlers[hIdx++];
                try { return handler(req, res, runHandler); } catch (e) { return next(e); }
              }
              return runHandler();
            }
          }
          return next();
        }
        return next();
      }

      await next();
    });
  }
}

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

// Request logger for visibility during evaluation
app.use((req, res, next) => {
  const start = Date.now();
  const originalJson = res.json;
  res.json = function (data) {
    const elapsed = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${req.method}] ${req.url} -> ${res.statusCode} (${elapsed}ms)`);
    }
    return originalJson.call(this, data);
  };
  next();
});

// ============================================================================
// PART 2: DATABASE ARCHITECTURE (3 Tables & Queries)
// ============================================================================

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'hostelhub.db');
let dbDriver = null;
let nativeDb = null;

try {
  const sqlite3 = require('sqlite3').verbose();
  nativeDb = new sqlite3.Database(DB_PATH);
  dbDriver = 'sqlite3';
} catch (e) {
  // Built-in SQLite available in Node 22+
  const { DatabaseSync } = require('node:sqlite');
  nativeDb = new DatabaseSync(DB_PATH);
  dbDriver = 'node:sqlite';
}

const db = {
  driver: dbDriver,
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      try {
        if (dbDriver === 'sqlite3') {
          nativeDb.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows || []));
        } else {
          resolve(nativeDb.prepare(sql).all(...params) || []);
        }
      } catch (err) { reject(err); }
    });
  },
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      try {
        if (dbDriver === 'sqlite3') {
          nativeDb.get(sql, params, (err, row) => err ? reject(err) : resolve(row || null));
        } else {
          resolve(nativeDb.prepare(sql).get(...params) || null);
        }
      } catch (err) { reject(err); }
    });
  },
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      try {
        if (dbDriver === 'sqlite3') {
          nativeDb.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve({ lastID: this.lastID, changes: this.changes });
          });
        } else {
          const res = nativeDb.prepare(sql).run(...params);
          resolve({ lastID: Number(res.lastInsertRowid), changes: Number(res.changes) });
        }
      } catch (err) { reject(err); }
    });
  },
  exec(sql) {
    return new Promise((resolve, reject) => {
      try {
        if (dbDriver === 'sqlite3') {
          nativeDb.exec(sql, err => err ? reject(err) : resolve());
        } else {
          nativeDb.exec(sql);
          resolve();
        }
      } catch (err) { reject(err); }
    });
  }
};

async function initSchema() {
  const ddl = `
    CREATE TABLE IF NOT EXISTS residents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      block TEXT NOT NULL,
      capacity INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS allotments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resident_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      allotment_date TEXT NOT NULL,
      return_date TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    );
  `;
  await db.exec(ddl);
}

async function seedDatabase() {
  await initSchema();
  await db.run('DELETE FROM allotments');
  await db.run('DELETE FROM residents');
  await db.run('DELETE FROM rooms');
  await db.run("DELETE FROM sqlite_sequence WHERE name IN ('allotments', 'residents', 'rooms')").catch(() => {});

  const rooms = [
    { name: 'Room 101', block: 'Block A', capacity: 2 },
    { name: 'Room 102', block: 'Block A', capacity: 1 },
    { name: 'Room 103', block: 'Block A', capacity: 2 },
    { name: 'Room 201', block: 'Block B', capacity: 2 },
    { name: 'Room 202', block: 'Block B', capacity: 1 },
    { name: 'Room 301', block: 'Block C', capacity: 3 }
  ];
  for (const r of rooms) {
    await db.run('INSERT INTO rooms (name, block, capacity) VALUES (?, ?, ?)', [r.name, r.block, r.capacity]);
  }

  const residents = [
    { name: 'Alex Johnson', email: 'alex.j@hostel.edu', phone: '+1-555-0101' },
    { name: 'Samira Patel', email: 'samira.p@hostel.edu', phone: '+1-555-0102' },
    { name: 'Carlos Gomez', email: 'carlos.g@hostel.edu', phone: '+1-555-0103' },
    { name: 'Emily Chen', email: 'emily.c@hostel.edu', phone: '+1-555-0104' }
  ];
  for (const res of residents) {
    await db.run('INSERT INTO residents (name, email, phone) VALUES (?, ?, ?)', [res.name, res.email, res.phone]);
  }

  // Allotment 1: Active allotment for Resident 1 in Room 101 (Used for Twist Test 1: Return)
  await db.run('INSERT INTO allotments (resident_id, room_id, allotment_date, return_date) VALUES (?, ?, ?, ?)',
    [1, 1, '2026-11-01T09:00:00Z', null]);

  // Allotment 2: Already returned historical allotment for Resident 1 in Room 102
  await db.run('INSERT INTO allotments (resident_id, room_id, allotment_date, return_date) VALUES (?, ?, ?, ?)',
    [1, 2, '2026-10-01T09:00:00Z', '2026-10-31T18:00:00Z']);

  // Allotment 3: Active allotment for Resident 2 in Room 201
  await db.run('INSERT INTO allotments (resident_id, room_id, allotment_date, return_date) VALUES (?, ?, ?, ?)',
    [2, 4, '2026-11-05T10:00:00Z', null]);
}

// ============================================================================
// PART 4: VALIDATION & SEARCH MIDDLEWARE
// ============================================================================

function validateRoom(req, res, next) {
  const { name, block, capacity } = req.body || {};
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Validation Error', message: 'Room name is required and must be a non-empty string.' });
  }
  if (!block || typeof block !== 'string' || block.trim() === '') {
    return res.status(400).json({ error: 'Validation Error', message: 'Block name is required and must be a non-empty string.' });
  }
  if (capacity !== undefined && (typeof capacity !== 'number' || capacity < 1)) {
    return res.status(400).json({ error: 'Validation Error', message: 'Capacity must be a positive integer.' });
  }
  next();
}

function validateResident(req, res, next) {
  const { name, email } = req.body || {};
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Validation Error', message: 'Resident name is required and must be a non-empty string.' });
  }
  if (email && (typeof email !== 'string' || !email.includes('@'))) {
    return res.status(400).json({ error: 'Validation Error', message: 'A valid email address is required.' });
  }
  next();
}

function validateAllotment(req, res, next) {
  const { resident_id, room_id } = req.body || {};
  if (!resident_id || isNaN(Number(resident_id))) {
    return res.status(400).json({ error: 'Validation Error', message: 'A valid numeric resident_id is required.' });
  }
  if (!room_id || isNaN(Number(room_id))) {
    return res.status(400).json({ error: 'Validation Error', message: 'A valid numeric room_id is required.' });
  }
  next();
}

// ============================================================================
// PART 3 & PART 4: ROOMS ENDPOINTS (CRUD & Search by Query Parameter)
// ============================================================================

// Root Project Discovery
app.get('/', (req, res) => {
  res.status(200).json({
    project: 'HostelHub',
    version: '1.0.0',
    group: 'NU-AIAGAI2C-G10',
    theme: 'Theme 10 of 30 - Room allotment',
    description: 'Hostel Room Allotment Backend System (All-in-one single folder)',
    endpoints: {
      rooms: {
        getAll: 'GET /rooms',
        searchByBlock: 'GET /rooms?block=Block A',
        getFreeRooms: 'GET /rooms/free',
        getOne: 'GET /rooms/:id',
        create: 'POST /rooms',
        update: 'PUT /rooms/:id',
        delete: 'DELETE /rooms/:id'
      },
      residents: {
        getAll: 'GET /residents',
        getOne: 'GET /residents/:id',
        create: 'POST /residents',
        history: 'GET /residents/:id/history'
      },
      allotments: {
        getAllWithJoin: 'GET /allotments',
        getOne: 'GET /allotments/:id',
        create: 'POST /allotments',
        returnFlow: 'POST /allotments/:id/return'
      }
    }
  });
});

// GET /rooms - List rooms with search query parameter (e.g. ?block=Block A)
app.get('/rooms', async (req, res) => {
  try {
    const { block, status, name } = req.query;
    let query = `
      SELECT r.*, 
        CASE 
          WHEN EXISTS (SELECT 1 FROM allotments a WHERE a.room_id = r.id AND a.return_date IS NULL) THEN 'occupied' 
          ELSE 'free' 
        END AS status
      FROM rooms r WHERE 1=1
    `;
    const params = [];
    if (block) {
      query += ' AND LOWER(r.block) LIKE ?';
      params.push(`%${block.toLowerCase().trim()}%`);
    }
    if (name) {
      query += ' AND LOWER(r.name) LIKE ?';
      params.push(`%${name.toLowerCase().trim()}%`);
    }
    if (status) {
      if (status.toLowerCase() === 'free') {
        query += ' AND NOT EXISTS (SELECT 1 FROM allotments a WHERE a.room_id = r.id AND a.return_date IS NULL)';
      } else if (status.toLowerCase() === 'occupied') {
        query += ' AND EXISTS (SELECT 1 FROM allotments a WHERE a.room_id = r.id AND a.return_date IS NULL)';
      }
    }
    query += ' ORDER BY r.block, r.name ASC';
    const rooms = await db.all(query, params);
    res.status(200).json(rooms);
  } catch (err) {
    res.status(500).json({ error: 'Database Error', message: err.message });
  }
});

// GET /rooms/free - Warden helper to view all unoccupied rooms
app.get('/rooms/free', async (req, res) => {
  try {
    const { block } = req.query;
    let query = `
      SELECT r.* FROM rooms r
      WHERE NOT EXISTS (SELECT 1 FROM allotments a WHERE a.room_id = r.id AND a.return_date IS NULL)
    `;
    const params = [];
    if (block) {
      query += ' AND LOWER(r.block) LIKE ?';
      params.push(`%${block.toLowerCase().trim()}%`);
    }
    query += ' ORDER BY r.block, r.name ASC';
    const freeRooms = await db.all(query, params);
    res.status(200).json(freeRooms);
  } catch (err) {
    res.status(500).json({ error: 'Database Error', message: err.message });
  }
});

// GET /rooms/:id - Get one room
app.get('/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const room = await db.get(`
      SELECT r.*, 
        CASE 
          WHEN EXISTS (SELECT 1 FROM allotments a WHERE a.room_id = r.id AND a.return_date IS NULL) THEN 'occupied' 
          ELSE 'free' 
        END AS status
      FROM rooms r WHERE r.id = ?`, [id]);
    if (!room) return res.status(404).json({ error: 'Not Found', message: `Room with ID ${id} not found.` });
    res.status(200).json(room);
  } catch (err) {
    res.status(500).json({ error: 'Database Error', message: err.message });
  }
});

// POST /rooms - Add room (Status 201)
app.post('/rooms', validateRoom, async (req, res) => {
  try {
    const { name, block, capacity } = req.body;
    const result = await db.run('INSERT INTO rooms (name, block, capacity) VALUES (?, ?, ?)',
      [name.trim(), block.trim(), capacity || 1]);
    const created = await db.get('SELECT * FROM rooms WHERE id = ?', [result.lastID]);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Database Error', message: err.message });
  }
});

// PUT /rooms/:id - Update room (Status 200)
app.put('/rooms/:id', validateRoom, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.get('SELECT * FROM rooms WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Not Found', message: `Room with ID ${id} not found.` });

    const { name, block, capacity } = req.body;
    await db.run('UPDATE rooms SET name = ?, block = ?, capacity = ? WHERE id = ?',
      [name.trim(), block.trim(), capacity !== undefined ? capacity : existing.capacity, id]);
    const updated = await db.get('SELECT * FROM rooms WHERE id = ?', [id]);
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Database Error', message: err.message });
  }
});

// DELETE /rooms/:id - Delete room (Status 200)
app.delete('/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.get('SELECT * FROM rooms WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Not Found', message: `Room with ID ${id} not found.` });
    await db.run('DELETE FROM rooms WHERE id = ?', [id]);
    res.status(200).json({ message: `Room ${id} successfully deleted.` });
  } catch (err) {
    res.status(500).json({ error: 'Database Error', message: err.message });
  }
});

// ============================================================================
// PART 3 & PART 5: ALLOTMENTS ENDPOINTS (Join Endpoint & Twist Return Flow)
// ============================================================================

// MANDATORY JOIN ENDPOINT: Allotments with resident name and room name
app.get('/allotments', async (req, res) => {
  try {
    const query = `
      SELECT 
        a.id,
        a.resident_id,
        r.name AS resident_name,
        r.email AS resident_email,
        a.room_id,
        rm.name AS room_name,
        rm.block AS room_block,
        a.allotment_date,
        a.return_date,
        CASE WHEN a.return_date IS NULL THEN 'active' ELSE 'returned' END AS status,
        a.created_at
      FROM allotments a
      JOIN residents r ON a.resident_id = r.id
      JOIN rooms rm ON a.room_id = rm.id
      ORDER BY a.id DESC
    `;
    const allotments = await db.all(query);
    res.status(200).json(allotments);
  } catch (err) {
    res.status(500).json({ error: 'Database Error', message: err.message });
  }
});

app.get('/allotments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const allotment = await db.get(`
      SELECT 
        a.id,
        a.resident_id,
        r.name AS resident_name,
        r.email AS resident_email,
        a.room_id,
        rm.name AS room_name,
        rm.block AS room_block,
        a.allotment_date,
        a.return_date,
        CASE WHEN a.return_date IS NULL THEN 'active' ELSE 'returned' END AS status,
        a.created_at
      FROM allotments a
      JOIN residents r ON a.resident_id = r.id
      JOIN rooms rm ON a.room_id = rm.id
      WHERE a.id = ?`, [id]);
    if (!allotment) return res.status(404).json({ error: 'Not Found', message: `Allotment with ID ${id} not found.` });
    res.status(200).json(allotment);
  } catch (err) {
    res.status(500).json({ error: 'Database Error', message: err.message });
  }
});

app.post('/allotments', validateAllotment, async (req, res) => {
  try {
    const { resident_id, room_id, allotment_date } = req.body;
    const resident = await db.get('SELECT * FROM residents WHERE id = ?', [resident_id]);
    if (!resident) return res.status(404).json({ error: 'Not Found', message: `Resident with ID ${resident_id} not found.` });

    const room = await db.get('SELECT * FROM rooms WHERE id = ?', [room_id]);
    if (!room) return res.status(404).json({ error: 'Not Found', message: `Room with ID ${room_id} not found.` });

    const active = await db.get('SELECT * FROM allotments WHERE room_id = ? AND return_date IS NULL', [room_id]);
    if (active) return res.status(409).json({ error: 'Conflict', message: `Room ${room.name} is already occupied.` });

    const result = await db.run('INSERT INTO allotments (resident_id, room_id, allotment_date, return_date) VALUES (?, ?, ?, NULL)',
      [resident_id, room_id, allotment_date || new Date().toISOString()]);
    const created = await db.get(`
      SELECT a.*, r.name AS resident_name, rm.name AS room_name 
      FROM allotments a 
      JOIN residents r ON a.resident_id = r.id 
      JOIN rooms rm ON a.room_id = rm.id 
      WHERE a.id = ?`, [result.lastID]);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Database Error', message: err.message });
  }
});

/**
 * YOUR TWIST REQUIREMENT:
 * POST /allotments/:id/return sets a return date.
 * Returning twice gets 409 and the message "Already returned".
 * 
 * Test 1: Return a allotment -> 200
 * Test 2: Return it again -> 409
 */
app.post('/allotments/:id/return', async (req, res) => {
  try {
    const { id } = req.params;
    const allotment = await db.get('SELECT * FROM allotments WHERE id = ?', [id]);
    if (!allotment) return res.status(404).json({ error: 'Not Found', message: `Allotment with ID ${id} not found.` });

    // Test 2: Returning twice gets 409 and the message "Already returned"
    if (allotment.return_date !== null && allotment.return_date !== undefined) {
      return res.status(409).json({
        message: 'Already returned',
        error: 'Conflict',
        returned_at: allotment.return_date
      });
    }

    // Test 1: Return a allotment -> 200
    const returnDate = (req.body && req.body.return_date) ? req.body.return_date : new Date().toISOString();
    await db.run('UPDATE allotments SET return_date = ? WHERE id = ?', [returnDate, id]);

    const updated = await db.get(`
      SELECT a.*, r.name AS resident_name, rm.name AS room_name, rm.block AS room_block, 'returned' AS status
      FROM allotments a 
      JOIN residents r ON a.resident_id = r.id 
      JOIN rooms rm ON a.room_id = rm.id 
      WHERE a.id = ?`, [id]);

    res.status(200).json({
      message: 'Room allotment successfully returned.',
      allotment: updated
    });
  } catch (err) {
    res.status(500).json({ error: 'Database Error', message: err.message });
  }
});

// ============================================================================
// PART 3 & PART 5: RESIDENTS ENDPOINTS & TWIST HISTORY
// ============================================================================

app.get('/residents', async (req, res) => {
  try {
    const residents = await db.all('SELECT * FROM residents ORDER BY id ASC');
    res.status(200).json(residents);
  } catch (err) {
    res.status(500).json({ error: 'Database Error', message: err.message });
  }
});

app.get('/residents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const resident = await db.get('SELECT * FROM residents WHERE id = ?', [id]);
    if (!resident) return res.status(404).json({ error: 'Not Found', message: `Resident with ID ${id} not found.` });
    res.status(200).json(resident);
  } catch (err) {
    res.status(500).json({ error: 'Database Error', message: err.message });
  }
});

app.post('/residents', validateResident, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const result = await db.run('INSERT INTO residents (name, email, phone) VALUES (?, ?, ?)',
      [name.trim(), email ? email.trim() : null, phone ? phone.trim() : null]);
    const created = await db.get('SELECT * FROM residents WHERE id = ?', [result.lastID]);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Database Error', message: err.message });
  }
});

/**
 * YOUR TWIST REQUIREMENT:
 * GET /residents/:id/history lists that resident's returned allotments.
 * 
 * Test 3: GET /residents/1/history -> 200, it is listed
 */
app.get('/residents/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const resident = await db.get('SELECT * FROM residents WHERE id = ?', [id]);
    if (!resident) return res.status(404).json({ error: 'Not Found', message: `Resident with ID ${id} not found.` });

    const history = await db.all(`
      SELECT 
        a.id AS allotment_id,
        a.resident_id,
        r.name AS resident_name,
        a.room_id,
        rm.name AS room_name,
        rm.block AS room_block,
        a.allotment_date,
        a.return_date,
        a.created_at
      FROM allotments a
      JOIN residents r ON a.resident_id = r.id
      JOIN rooms rm ON a.room_id = rm.id
      WHERE a.resident_id = ? AND a.return_date IS NOT NULL
      ORDER BY a.return_date DESC`, [id]);

    res.status(200).json(history);
  } catch (err) {
    res.status(500).json({ error: 'Database Error', message: err.message });
  }
});

// ============================================================================
// SERVER STARTUP FUNCTION
// ============================================================================

async function startServer() {
  await seedDatabase();
  console.log(`Database engine: [${db.driver}]`);
  const server = app.listen(PORT, () => {
    console.log('====================================================');
    console.log(` HostelHub API Server is running on port ${PORT}`);
    console.log(` Local URL: http://localhost:${PORT}`);
    console.log(' Group: NU-AIAGAI2C-G10 | Theme 10: Room allotment');
    console.log('====================================================');
  });
  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = { app, db, seedDatabase, startServer };
