/**
 * HostelHub Database Seeder
 * Populates sample data for residents, rooms, and allotments
 */

const db = require('./database');

async function seed() {
  await db.initSchema();

  // Clear existing records for clean seeding
  await db.run('DELETE FROM allotments');
  await db.run('DELETE FROM residents');
  await db.run('DELETE FROM rooms');
  await db.run("DELETE FROM sqlite_sequence WHERE name IN ('allotments', 'residents', 'rooms')").catch(() => {});

  console.log('Seeding Rooms...');
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

  console.log('Seeding Residents...');
  const residents = [
    { name: 'Alex Johnson', email: 'alex.j@hostel.edu', phone: '+1-555-0101' },
    { name: 'Samira Patel', email: 'samira.p@hostel.edu', phone: '+1-555-0102' },
    { name: 'Carlos Gomez', email: 'carlos.g@hostel.edu', phone: '+1-555-0103' },
    { name: 'Emily Chen', email: 'emily.c@hostel.edu', phone: '+1-555-0104' }
  ];

  for (const res of residents) {
    await db.run('INSERT INTO residents (name, email, phone) VALUES (?, ?, ?)', [res.name, res.email, res.phone]);
  }

  console.log('Seeding Allotments...');
  // Allotment 1: Active allotment for Resident 1 (Alex Johnson) in Room 101 (Ready for Test 1: Return allotment)
  await db.run(
    'INSERT INTO allotments (resident_id, room_id, allotment_date, return_date) VALUES (?, ?, ?, ?)',
    [1, 1, '2026-11-01T09:00:00Z', null]
  );

  // Allotment 2: Already returned historical allotment for Resident 1 in Room 102
  await db.run(
    'INSERT INTO allotments (resident_id, room_id, allotment_date, return_date) VALUES (?, ?, ?, ?)',
    [1, 2, '2026-10-01T09:00:00Z', '2026-10-31T18:00:00Z']
  );

  // Allotment 3: Active allotment for Resident 2 (Samira Patel) in Room 201
  await db.run(
    'INSERT INTO allotments (resident_id, room_id, allotment_date, return_date) VALUES (?, ?, ?, ?)',
    [2, 4, '2026-11-05T10:00:00Z', null]
  );

  console.log('Database successfully seeded!');
}

if (require.main === module) {
  seed().then(() => {
    console.log('Seed completed successfully.');
    process.exit(0);
  }).catch((err) => {
    console.error('Error during seeding:', err);
    process.exit(1);
  });
}

module.exports = seed;
