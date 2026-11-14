/**
 * HostelHub Rooms Router
 * Part 3: REST endpoints & Part 4: Validation and search
 * CRUD operations for rooms with block search and status codes
 */

let express;
try {
  express = require('express');
} catch (e) {
  express = require('../mini-express');
}

const router = express.Router();
const db = require('../db/database');
const { validateRoom } = require('../middleware/validation');

/**
 * GET /rooms
 * Get all rooms, optionally filtered by block query parameter (e.g., ?block=Block A or ?block=A)
 * Also supports ?status=free to quickly see available rooms
 */
router.get('/', async (req, res) => {
  try {
    const { block, status, name } = req.query;

    let query = `
      SELECT r.*, 
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM allotments a 
            WHERE a.room_id = r.id AND a.return_date IS NULL
          ) THEN 'occupied' 
          ELSE 'free' 
        END AS status
      FROM rooms r
      WHERE 1=1
    `;
    const params = [];

    // Search by query parameter: rooms by block
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
        query += ` AND NOT EXISTS (
          SELECT 1 FROM allotments a 
          WHERE a.room_id = r.id AND a.return_date IS NULL
        )`;
      } else if (status.toLowerCase() === 'occupied') {
        query += ` AND EXISTS (
          SELECT 1 FROM allotments a 
          WHERE a.room_id = r.id AND a.return_date IS NULL
        )`;
      }
    }

    query += ' ORDER BY r.block, r.name ASC';

    const rooms = await db.all(query, params);
    res.status(200).json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Database Error', message: error.message });
  }
});

/**
 * GET /rooms/free
 * Dedicated endpoint for the warden to quickly list all free rooms grouped/filtered by block
 */
router.get('/free', async (req, res) => {
  try {
    const { block } = req.query;
    let query = `
      SELECT r.* 
      FROM rooms r
      WHERE NOT EXISTS (
        SELECT 1 FROM allotments a 
        WHERE a.room_id = r.id AND a.return_date IS NULL
      )
    `;
    const params = [];

    if (block) {
      query += ' AND LOWER(r.block) LIKE ?';
      params.push(`%${block.toLowerCase().trim()}%`);
    }

    query += ' ORDER BY r.block, r.name ASC';
    const freeRooms = await db.all(query, params);
    res.status(200).json(freeRooms);
  } catch (error) {
    res.status(500).json({ error: 'Database Error', message: error.message });
  }
});

/**
 * GET /rooms/:id
 * Get a single room by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const room = await db.get(
      `SELECT r.*, 
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM allotments a 
            WHERE a.room_id = r.id AND a.return_date IS NULL
          ) THEN 'occupied' 
          ELSE 'free' 
        END AS status
       FROM rooms r WHERE r.id = ?`,
      [id]
    );

    if (!room) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Room with ID ${id} not found.`
      });
    }

    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ error: 'Database Error', message: error.message });
  }
});

/**
 * POST /rooms
 * Add a new room (Requires name and block)
 */
router.post('/', validateRoom, async (req, res) => {
  try {
    const { name, block, capacity } = req.body;
    const roomCapacity = capacity || 1;

    const result = await db.run(
      'INSERT INTO rooms (name, block, capacity) VALUES (?, ?, ?)',
      [name.trim(), block.trim(), roomCapacity]
    );

    const newRoom = await db.get('SELECT * FROM rooms WHERE id = ?', [result.lastID]);
    res.status(201).json(newRoom);
  } catch (error) {
    res.status(500).json({ error: 'Database Error', message: error.message });
  }
});

/**
 * PUT /rooms/:id
 * Update an existing room
 */
router.put('/:id', validateRoom, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, block, capacity } = req.body;

    const existingRoom = await db.get('SELECT * FROM rooms WHERE id = ?', [id]);
    if (!existingRoom) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Room with ID ${id} not found.`
      });
    }

    const roomCapacity = capacity !== undefined ? capacity : existingRoom.capacity;

    await db.run(
      'UPDATE rooms SET name = ?, block = ?, capacity = ? WHERE id = ?',
      [name.trim(), block.trim(), roomCapacity, id]
    );

    const updatedRoom = await db.get('SELECT * FROM rooms WHERE id = ?', [id]);
    res.status(200).json(updatedRoom);
  } catch (error) {
    res.status(500).json({ error: 'Database Error', message: error.message });
  }
});

/**
 * DELETE /rooms/:id
 * Delete a room
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existingRoom = await db.get('SELECT * FROM rooms WHERE id = ?', [id]);
    if (!existingRoom) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Room with ID ${id} not found.`
      });
    }

    await db.run('DELETE FROM rooms WHERE id = ?', [id]);
    res.status(200).json({
      message: `Room ${id} successfully deleted.`
    });
  } catch (error) {
    res.status(500).json({ error: 'Database Error', message: error.message });
  }
});

module.exports = router;
