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
  
  try {
    // 🔥 DATE VALIDATION: Ensure summons follow chronological order 🔥
    const { caseNo, summonDate } = req.body;
    
    if (caseNo && summonDate) {
      // Get all active summons for this case
      const existingSummons = await Summons.find({
        caseNo: caseNo,
        status: { $in: ['Active', 'Pending'] }
      });

      if (existingSummons.length > 0) {
        // Get the latest summon date
        const latestSummon = existingSummons.reduce((latest, current) => {
          const latestDate = new Date(latest.summonDate);
          const currentDate = new Date(current.summonDate);
          return currentDate > latestDate ? current : latest;
        });

        const latestDate = new Date(latestSummon.summonDate);
        const newDate = new Date(summonDate);

        // Check if new summon is on or before the latest summon date
        if (newDate <= latestDate) {
          return res.status(400).json({
            message: 'Invalid summon date',
            error: `The next summon must be scheduled after ${latestDate.toLocaleDateString()}.`,
            latestSummonDate: latestDate.toISOString().split('T')[0]
          });
        }
      }
    }

    const summons = new Summons(req.body);
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
    // 🔥 DATE VALIDATION: Ensure summons follow chronological order on update 🔥
    const { caseNo, summonDate } = req.body;
    
    if (caseNo && summonDate) {
      // Get all other active summons for this case (excluding current one)
      const existingSummons = await Summons.find({
        caseNo: caseNo,
        _id: { $ne: req.params.id },
        status: { $in: ['Active', 'Pending'] }
      });

      if (existingSummons.length > 0) {
        // Get the latest summon date
        const latestSummon = existingSummons.reduce((latest, current) => {
          const latestDate = new Date(latest.summonDate);
          const currentDate = new Date(current.summonDate);
          return currentDate > latestDate ? current : latest;
        });

        const latestDate = new Date(latestSummon.summonDate);
        const newDate = new Date(summonDate);

        // Check if updated summon violates chronological order
        if (newDate <= latestDate) {
          return res.status(400).json({
            message: 'Invalid summon date',
            error: `The summon must be scheduled after ${latestDate.toLocaleDateString()}.`,
            latestSummonDate: latestDate.toISOString().split('T')[0]
          });
        }
      }
    }

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
