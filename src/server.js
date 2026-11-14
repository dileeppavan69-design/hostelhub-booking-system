/**
 * HostelHub Server Entrypoint
 * Part 1: Server and routes
 */

const app = require('./app');
const db = require('./db/database');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Ensure database tables exist
    await db.initSchema();
    console.log(`Database engine initialized using driver: [${db.dbDriver}]`);

    app.listen(PORT, () => {
      console.log('====================================================');
      console.log(` HostelHub API Server is running on port ${PORT}`);
      console.log(` Local URL: http://localhost:${PORT}`);
      console.log(' Group: NU-AIAGAI2C-G10 | Theme 10: Room allotment');
      console.log('====================================================');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
