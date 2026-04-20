import mongoose from 'mongoose';

const summonsSchema = new mongoose.Schema({
  caseNo: {
    type: String,
    required: true
  },
  summonType: {
    type: String,
    enum: ['1', '2', '3'],
    required: true
  },
  residentName: {
    type: String,
    required: true
  },
  summonDate: {
    type: String,
    required: true
  },
  summonTime: {
    type: String,
    required: true
  },
  summonReason: {
    type: String,
    required: true
  },
  notedBy: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Pending', 'Settled', 'Cancelled'],
    default: 'Active'
  },
  complainantName: String,
  type: String,
  caseNotes: {
    type: [new mongoose.Schema({
      id: { type: Number, required: true },
      content: { type: String, required: true },
      date: { type: String, required: true },
      createdAt: { type: String },
      updatedAt: { type: String }
    }, { _id: false })],
    default: []
  }
}, {
  timestamps: true
});

// Create compound index for caseNo + summonType to ensure uniqueness per case
summonsSchema.index({ caseNo: 1, summonType: 1 }, { unique: true });

const Summons = mongoose.model('Summons', summonsSchema);

export default Summons;
