import express from 'express';
import Blacklist from '../models/Blacklist.js';

const router = express.Router();

// GET all blacklist entries
router.get('/', async (req, res) => {
  try {
    const blacklist = await Blacklist.find().sort({ createdAt: -1 });
    res.json(blacklist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single blacklist entry by ID
router.get('/:id', async (req, res) => {
  try {
    const entry = await Blacklist.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Blacklist entry not found' });
    }
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE new blacklist entry
router.post('/', async (req, res) => {
  const entry = new Blacklist(req.body);
  
  try {
    const newEntry = await entry.save();
    res.status(201).json(newEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// UPDATE blacklist entry
router.put('/:id', async (req, res) => {
  try {
    const updatedEntry = await Blacklist.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedEntry) {
      return res.status(404).json({ message: 'Blacklist entry not found' });
    }
    
    res.json(updatedEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE blacklist entry
router.delete('/:id', async (req, res) => {
  try {
    const deletedEntry = await Blacklist.findByIdAndDelete(req.params.id);
    
    if (!deletedEntry) {
      return res.status(404).json({ message: 'Blacklist entry not found' });
    }
    
    res.json({ message: 'Blacklist entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
