import mongoose from 'mongoose';

const curfewSchema = new mongoose.Schema({
  residentName: {
    type: String,
    required: true
  },
  age: Number,
  violationDate: {
    type: Date,
    required: true
  },
  violationTime: String,
  location: String,
  description: String,
  status: {
    type: String,
    enum: ['ACTIVE', 'RESOLVED', 'DISMISSED'],
    default: 'ACTIVE'
  }
}, {
  timestamps: true
});

const Curfew = mongoose.model('Curfew', curfewSchema);

export default Curfew;
