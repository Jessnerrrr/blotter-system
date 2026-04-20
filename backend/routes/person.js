import express from 'express';
import Resident from '../models/Resident.js';

const router = express.Router();

// @route   GET /api/person/get-person-by-name
// @desc    Find resident by name and return birthdate only
// @access  Public
router.get('/get-person-by-name', async (req, res) => {
  try {
    const { name } = req.query;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name query parameter is required.' });
    }

    const searchTerms = name.trim().split(/\s+/).map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const query = {
      status: 'ACTIVE',
      archival_state: 'ACTIVE',
      $and: searchTerms.map((term) => ({
        $or: [
          { first_name: { $regex: term, $options: 'i' } },
          { middle_name: { $regex: term, $options: 'i' } },
          { last_name: { $regex: term, $options: 'i' } },
          { extension: { $regex: term, $options: 'i' } }
        ]
      }))
    };

    const resident = await Resident.findOne(query)
      .select('first_name middle_name last_name extension birthdate')
      .sort({ last_name: 1, first_name: 1 });

    if (!resident) {
      return res.status(404).json({ message: 'Resident not found.' });
    }

    const fullName = [resident.first_name, resident.middle_name, resident.last_name, resident.extension]
      .filter(Boolean)
      .join(' ');

    res.json({
      name: fullName,
      birthdate: resident.birthdate ? resident.birthdate.toISOString().split('T')[0] : null
    });
  } catch (error) {
    console.error('Error fetching person by name:', error);
    res.status(500).json({ message: 'Error fetching person by name.', error: error.message });
  }
});

export default router;
