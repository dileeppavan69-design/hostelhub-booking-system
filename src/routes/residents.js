/**
 * HostelHub Residents Router
 * Part 3: REST endpoints & Part 5: Twist rule
 * Resident management and history endpoint
 */

let express;
try {
  express = require('express');
} catch (e) {
  express = require('../mini-express');
}

const router = express.Router();
const db = require('../db/database');
const { validateResident } = require('../middleware/validation');

/**
 * GET /residents
 * List all residents
 */
router.get('/', async (req, res) => {
  try {
    const residents = await db.all('SELECT * FROM residents ORDER BY id ASC');
    res.status(200).json(residents);
  } catch (error) {
    res.status(500).json({ error: 'Database Error', message: error.message });
  }
});

/**
 * GET /residents/:id
 * Get a specific resident by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const resident = await db.get('SELECT * FROM residents WHERE id = ?', [id]);

    if (!resident) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Resident with ID ${id} not found.`
      });
    }

    res.status(200).json(resident);
  } catch (error) {
    res.status(500).json({ error: 'Database Error', message: error.message });
  }
});

/**
 * POST /residents
 * Create a new resident
 */
router.post('/', validateResident, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const result = await db.run(
      'INSERT INTO residents (name, email, phone) VALUES (?, ?, ?)',
      [name.trim(), email ? email.trim() : null, phone ? phone.trim() : null]
    );

    const newResident = await db.get('SELECT * FROM residents WHERE id = ?', [result.lastID]);
    res.status(201).json(newResident);
  } catch (error) {
    res.status(500).json({ error: 'Database Error', message: error.message });
  }
});

/**
 * GET /residents/:id/history
 * YOUR TWIST REQUIREMENT:
 * "GET /residents/:id/history lists that resident's returned allotments."
 * Test 3: GET /residents/1/history -> 200, it is listed
 */
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if resident exists
    const resident = await db.get('SELECT * FROM residents WHERE id = ?', [id]);
    if (!resident) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Resident with ID ${id} not found.`
      });
    }

    // Query all returned allotments for this resident, joined with room info
    const history = await db.all(
      `SELECT 
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
       ORDER BY a.return_date DESC`,
      [id]
    );

    res.status(200).json(history);
  } catch (error) {
    console.error('Error fetching resident history:', error);
    res.status(500).json({ error: 'Database Error', message: error.message });
  }
});

module.exports = router;
