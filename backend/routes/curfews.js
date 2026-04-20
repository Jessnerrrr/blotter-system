import express from 'express';
import Curfew from '../models/Curfew.js';

const router = express.Router();

// GET all curfew violations
router.get('/', async (req, res) => {
  try {
    const curfews = await Curfew.find().sort({ createdAt: -1 });
    res.json(curfews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single curfew violation by ID
router.get('/:id', async (req, res) => {
  try {
    const curfew = await Curfew.findById(req.params.id);
    if (!curfew) {
      return res.status(404).json({ message: 'Curfew violation not found' });
    }
    res.json(curfew);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE new curfew violation
router.post('/', async (req, res) => {
  const curfew = new Curfew(req.body);
  
  try {
    const newCurfew = await curfew.save();
    res.status(201).json(newCurfew);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// UPDATE curfew violation
router.put('/:id', async (req, res) => {
  try {
    const updatedCurfew = await Curfew.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedCurfew) {
      return res.status(404).json({ message: 'Curfew violation not found' });
    }
    
    res.json(updatedCurfew);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE curfew violation
router.delete('/:id', async (req, res) => {
  try {
    const deletedCurfew = await Curfew.findByIdAndDelete(req.params.id);
    
    if (!deletedCurfew) {
      return res.status(404).json({ message: 'Curfew violation not found' });
    }
    
    res.json({ message: 'Curfew violation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
