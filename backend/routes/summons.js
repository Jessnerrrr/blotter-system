import express from 'express';
import Summons from '../models/Summons.js';

const router = express.Router();

// GET all summons
router.get('/', async (req, res) => {
  try {
    const summons = await Summons.find().sort({ createdAt: -1 });
    res.json(summons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single summons by ID
router.get('/:id', async (req, res) => {
  try {
    const summons = await Summons.findById(req.params.id);
    if (!summons) {
      return res.status(404).json({ message: 'Summons not found' });
    }
    res.json(summons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE new summons
router.post('/', async (req, res) => {
  console.log('📥 Received summon creation request:', req.body);
  
  const summons = new Summons(req.body);
  
  try {
    const newSummons = await summons.save();
    console.log('✅ Summon created successfully:', newSummons._id);
    res.status(201).json(newSummons);
  } catch (error) {
    console.error('❌ Error creating summon:', error.message);
    console.error('Validation errors:', error.errors);
    res.status(400).json({ 
      message: error.message,
      errors: error.errors,
      name: error.name 
    });
  }
});

// UPDATE summons
router.put('/:id', async (req, res) => {
  try {
    const updatedSummons = await Summons.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedSummons) {
      return res.status(404).json({ message: 'Summons not found' });
    }
    
    res.json(updatedSummons);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE summons
router.delete('/:id', async (req, res) => {
  try {
    const deletedSummons = await Summons.findByIdAndDelete(req.params.id);
    
    if (!deletedSummons) {
      return res.status(404).json({ message: 'Summons not found' });
    }
    
    res.json({ message: 'Summons deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
