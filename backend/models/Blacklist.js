import mongoose from 'mongoose';

const blacklistSchema = new mongoose.Schema({
  residentName: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  dateAdded: {
    type: Date,
    default: Date.now
  },
  addedBy: String,
  status: {
    type: String,
    enum: ['ACTIVE', 'REMOVED'],
    default: 'ACTIVE'
  },
  notes: String
}, {
  timestamps: true
});

const Blacklist = mongoose.model('Blacklist', blacklistSchema);

export default Blacklist;
