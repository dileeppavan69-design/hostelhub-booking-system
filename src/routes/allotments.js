/**
 * HostelHub Allotments Router
 * Part 3: REST endpoints & Part 5: Twist rule
 * Handles allotments, the mandatory JOIN endpoint, and the return flow
 */

let express;
try {
  express = require('express');
} catch (e) {
  express = require('../mini-express');
}

const router = express.Router();
const db = require('../db/database');
const { validateAllotment } = require('../middleware/validation');

/**
 * GET /allotments
 * MANDATORY JOIN ENDPOINT:
 * "One join endpoint: allotments with the resident name and the room name."
 */
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
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
        CASE 
          WHEN a.return_date IS NULL THEN 'active' 
          ELSE 'returned' 
        END AS status,
        a.created_at
      FROM allotments a
      JOIN residents r ON a.resident_id = r.id
      JOIN rooms rm ON a.room_id = rm.id
      WHERE 1=1
    `;
    const params = [];

    if (status === 'active') {
      query += ' AND a.return_date IS NULL';
    } else if (status === 'returned') {
      query += ' AND a.return_date IS NOT NULL';
    }

    query += ' ORDER BY a.id DESC';

    const allotments = await db.all(query, params);
    res.status(200).json(allotments);
  } catch (error) {
    console.error('Error fetching allotments join:', error);
    res.status(500).json({ error: 'Database Error', message: error.message });
  }
});

/**
 * GET /allotments/:id
 * Get single allotment details with resident and room joined
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const allotment = await db.get(
      `SELECT 
        a.id,
        a.resident_id,
        r.name AS resident_name,
        r.email AS resident_email,
        a.room_id,
        rm.name AS room_name,
        rm.block AS room_block,
        a.allotment_date,
        a.return_date,
        CASE 
          WHEN a.return_date IS NULL THEN 'active' 
          ELSE 'returned' 
        END AS status,
        a.created_at
      FROM allotments a
      JOIN residents r ON a.resident_id = r.id
      JOIN rooms rm ON a.room_id = rm.id
      WHERE a.id = ?`,
      [id]
    );

    if (!allotment) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Allotment with ID ${id} not found.`
      });
    }

    res.status(200).json(allotment);
  } catch (error) {
    res.status(500).json({ error: 'Database Error', message: error.message });
  }
});

/**
 * POST /allotments
 * Create a new room allotment
 */
router.post('/', validateAllotment, async (req, res) => {
  try {
    const { resident_id, room_id, allotment_date } = req.body;

    // Verify resident exists
    const resident = await db.get('SELECT * FROM residents WHERE id = ?', [resident_id]);
    if (!resident) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Resident with ID ${resident_id} does not exist.`
      });
    }

    // Verify room exists
    const room = await db.get('SELECT * FROM rooms WHERE id = ?', [room_id]);
    if (!room) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Room with ID ${room_id} does not exist.`
      });
    }

    // Check if room is already currently allotted (active allotment without return_date)
    const existingActive = await db.get(
      'SELECT * FROM allotments WHERE room_id = ? AND return_date IS NULL',
      [room_id]
    );

    if (existingActive) {
      return res.status(409).json({
        error: 'Conflict',
        message: `Room ${room.name} is already occupied by resident ID ${existingActive.resident_id}.`
      });
    }

    const dateToSet = allotment_date || new Date().toISOString();

    const result = await db.run(
      'INSERT INTO allotments (resident_id, room_id, allotment_date, return_date) VALUES (?, ?, ?, NULL)',
      [resident_id, room_id, dateToSet]
    );

    const newAllotment = await db.get(
      `SELECT 
        a.id,
        a.resident_id,
        r.name AS resident_name,
        a.room_id,
        rm.name AS room_name,
        a.allotment_date,
        a.return_date
      FROM allotments a
      JOIN residents r ON a.resident_id = r.id
      JOIN rooms rm ON a.room_id = rm.id
      WHERE a.id = ?`,
      [result.lastID]
    );

    res.status(201).json(newAllotment);
  } catch (error) {
    res.status(500).json({ error: 'Database Error', message: error.message });
  }
});

/**
 * POST /allotments/:id/return
 * YOUR TWIST REQUIREMENT:
 * "POST /allotments/:id/return sets a return date.
 * Returning twice gets 409 and the message 'Already returned'."
 * 
 * Test 1: Return a allotment -> 200
 * Test 2: Return it again -> 409 and message "Already returned"
 */
router.post('/:id/return', async (req, res) => {
  try {
    const { id } = req.params;

    // Find the allotment
    const allotment = await db.get('SELECT * FROM allotments WHERE id = ?', [id]);

    if (!allotment) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Allotment with ID ${id} not found.`
      });
    }

    // Check if already returned -> Test 2: Return it again -> 409
    if (allotment.return_date !== null && allotment.return_date !== undefined) {
      return res.status(409).json({
        message: 'Already returned',
        error: 'Conflict',
        returned_at: allotment.return_date
      });
    }

    // Set return date -> Test 1: Return a allotment -> 200
    const returnDate = req.body && req.body.return_date ? req.body.return_date : new Date().toISOString();

    await db.run('UPDATE allotments SET return_date = ? WHERE id = ?', [returnDate, id]);

    // Fetch updated allotment with joined resident and room details
    const updated = await db.get(
      `SELECT 
        a.id,
        a.resident_id,
        r.name AS resident_name,
        a.room_id,
        rm.name AS room_name,
        rm.block AS room_block,
        a.allotment_date,
        a.return_date,
        'returned' AS status
      FROM allotments a
      JOIN residents r ON a.resident_id = r.id
      JOIN rooms rm ON a.room_id = rm.id
      WHERE a.id = ?`,
      [id]
    );

    res.status(200).json({
      message: 'Room allotment successfully returned.',
      allotment: updated
    });
  } catch (error) {
    console.error('Error returning allotment:', error);
    res.status(500).json({ error: 'Database Error', message: error.message });
  }
});

module.exports = router;
