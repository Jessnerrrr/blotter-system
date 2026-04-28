import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['LUPON', 'VAWC', 'BLOTTER', 'COMPLAIN'],
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'ONGOING', 'RESOLVED', 'DISMISSED', 'SETTLED', 'BLACKLISTED', 'ESCALATED'],
    default: 'PENDING'
  },
  caseNo: {
    type: String,
    required: true,
    unique: true
  },
  complainantName: {
    type: String,
    required: true
  },
  resident: String,
  contact: String,
  date: String,
  blacklistedAt: { 
    type: Date,
    default: null
  },
  fullData: {
    selectedReportType: String,
    selectedRole: String,
    caseNo: String,
    dateFiled: String,
    complainantName: String,
    complainantContact: String,
    complainantAddress: String,
    respondentName: String,
    respondentContact: String,
    respondentAddress: String,
    incidentDate: String,
    incidentLocation: String,
    incidentDesc: String
  }
}, {
  timestamps: true
});

const Case = mongoose.model('Case', caseSchema);

export default Case;