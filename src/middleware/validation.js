/**
 * HostelHub Validation Middleware
 * Part 4: Validation and Search
 * Ensures strict input validation with clear error messages
 */

function validateRoom(req, res, next) {
  const { name, block, capacity } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Room name is required and must be a non-empty string.'
    });
  }

  if (!block || typeof block !== 'string' || block.trim() === '') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Block name is required and must be a non-empty string.'
    });
  }

  if (capacity !== undefined && (typeof capacity !== 'number' || capacity < 1)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Capacity must be a positive integer.'
    });
  }

  next();
}

function validateResident(req, res, next) {
  const { name, email } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Resident name is required and must be a non-empty string.'
    });
  }

  if (email && (typeof email !== 'string' || !email.includes('@'))) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'A valid email address is required.'
    });
  }

  next();
}

function validateAllotment(req, res, next) {
  const { resident_id, room_id } = req.body || {};

  if (!resident_id || isNaN(Number(resident_id))) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'A valid numeric resident_id is required.'
    });
  }

  if (!room_id || isNaN(Number(room_id))) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'A valid numeric room_id is required.'
    });
  }

  next();
}

module.exports = {
  validateRoom,
  validateResident,
  validateAllotment
};
