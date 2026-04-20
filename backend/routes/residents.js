import express from 'express';
import Resident from '../models/Resident.js';

const router = express.Router();

// @route   GET /api/residents/search
// @desc    Search residents by name
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json([]);
    }

    const searchTerm = q.trim();

    // Search only ACTIVE residents
    const residents = await Resident.find({
      status: 'ACTIVE',
      archival_state: 'ACTIVE',
      $or: [
        { first_name: { $regex: searchTerm, $options: 'i' } },
        { middle_name: { $regex: searchTerm, $options: 'i' } },
        { last_name: { $regex: searchTerm, $options: 'i' } }
      ]
    })
    .select('resident_code first_name middle_name last_name extension address_text contact_number')
    .limit(10)
    .sort({ last_name: 1, first_name: 1 });

    // Format the response with full name
    const formattedResidents = residents.map(resident => ({
      _id: resident._id,
      resident_code: resident.resident_code,
      first_name: resident.first_name,
      middle_name: resident.middle_name,
      last_name: resident.last_name,
      extension: resident.extension,
      full_name: [resident.first_name, resident.middle_name, resident.last_name, resident.extension]
        .filter(Boolean)
        .join(' '),
      address_text: resident.address_text,
      contact_number: resident.contact_number
    }));

    res.json(formattedResidents);
  } catch (error) {
    console.error('Error searching residents:', error);
    res.status(500).json({ 
      message: 'Error searching residents',
      error: error.message 
    });
  }
});

const calculateAge = (birthdate) => {
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return Math.max(age, 0);
};

const formatResidentFullName = (resident) => {
  return [resident.first_name, resident.middle_name, resident.last_name, resident.extension]
    .filter(Boolean)
    .join(' ');
};

// @route   GET /api/residents/get-age-by-name
// @desc    Get resident age from name
// @access  Public
router.get('/get-age-by-name', async (req, res) => {
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
      return res.status(404).json({ message: 'Resident not found' });
    }

    const birthdate = resident.birthdate ? resident.birthdate.toISOString().split('T')[0] : null;
    const age = resident.birthdate ? calculateAge(resident.birthdate) : null;

    res.json({
      name: formatResidentFullName(resident),
      birthdate,
      age
    });
  } catch (error) {
    console.error('Error fetching resident age:', error);
    res.status(500).json({
      message: 'Error fetching resident age',
      error: error.message
    });
  }
});

// @route   GET /api/residents/:id
// @desc    Get single resident by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id)
      .select('resident_code first_name middle_name last_name extension address_text contact_number');

    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    const formattedResident = {
      _id: resident._id,
      resident_code: resident.resident_code,
      first_name: resident.first_name,
      middle_name: resident.middle_name,
      last_name: resident.last_name,
      extension: resident.extension,
      full_name: [resident.first_name, resident.middle_name, resident.last_name, resident.extension]
        .filter(Boolean)
        .join(' '),
      address_text: resident.address_text,
      contact_number: resident.contact_number
    };

    res.json(formattedResident);
  } catch (error) {
    console.error('Error fetching resident:', error);
    res.status(500).json({ 
      message: 'Error fetching resident',
      error: error.message 
    });
  }
});

export default router;
