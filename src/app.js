/**
 * HostelHub Application Setup
 * Part 1: Server and routes
 * Express setup, middleware configuration, and route binding
 */

let express;
try {
  express = require('express');
} catch (e) {
  express = require('./mini-express');
}

const roomsRouter = require('./routes/rooms');
const residentsRouter = require('./routes/residents');
const allotmentsRouter = require('./routes/allotments');

const app = express();

// Body parser middleware
app.use(express.json());

// Request logger for visibility during demo and evaluation
app.use((req, res, next) => {
  const start = Date.now();
  const oldJson = res.json;
  res.json = function (data) {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${req.method}] ${req.url} -> ${res.statusCode} (${duration}ms)`);
    }
    return oldJson.call(this, data);
  };
  next();
});

// Root Information & Health Check
app.get('/', (req, res) => {
  res.status(200).json({
    project: 'HostelHub',
    version: '1.0.0',
    group: 'NU-AIAGAI2C-G10',
    theme: 'Theme 10 of 30 - Room allotment',
    description: 'Hostel Room Allotment Backend Management System',
    endpoints: {
      rooms: {
        getAll: 'GET /rooms',
        searchByBlock: 'GET /rooms?block=Block A',
        getFree: 'GET /rooms/free',
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

// Route registration
app.use('/rooms', roomsRouter);
app.use('/residents', residentsRouter);
app.use('/allotments', allotmentsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.url} does not exist.`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

module.exports = app;
