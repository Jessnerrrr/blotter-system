import express from 'express';
import Case from '../models/Case.js';

const router = express.Router();

// GET all cases
router.get('/', async (req, res) => {
  try {
    const cases = await Case.find().sort({ createdAt: -1 });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single case by ID
router.get('/:id', async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found' });
    }
    res.json(caseItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE new case
router.post('/', async (req, res) => {
  const caseItem = new Case(req.body);
  
  try {
    const newCase = await caseItem.save();
    res.status(201).json(newCase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// UPDATE case
router.put('/:id', async (req, res) => {
  try {
    const updatedCase = await Case.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedCase) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    res.json(updatedCase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE case
router.delete('/:id', async (req, res) => {
  try {
    const deletedCase = await Case.findByIdAndDelete(req.params.id);
    
    if (!deletedCase) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    res.json({ message: 'Case deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
