import mongoose from 'mongoose';
import { profilingConnection } from '../config/db.js';

const residentSchema = new mongoose.Schema({
  resident_code: {
    type: String,
    required: true,
    unique: true
  },
  first_name: {
    type: String,
    required: true
  },
  middle_name: {
    type: String,
    default: ''
  },
  last_name: {
    type: String,
    required: true
  },
  extension: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    enum: ['Male', 'Female'],
    required: true
  },
  birthdate: {
    type: Date
  },
  civil_status: {
    type: String
  },
  contact_number: {
    type: String
  },
  email: {
    type: String
  },
  occupation_sector: {
    type: String
  },
  occupation_type: {
    type: String
  },
  voter_status: {
    type: String
  },
  household_id: {
    type: mongoose.Schema.Types.ObjectId
  },
  purok_id: {
    type: mongoose.Schema.Types.ObjectId
  },
  address_text: {
    type: String
  },
  is_senior: {
    type: Boolean,
    default: false
  },
  is_pwd: {
    type: Boolean,
    default: false
  },
  is_indigent: {
    type: Boolean,
    default: false
  },
  is_solo_parent: {
    type: Boolean,
    default: false
  },
  is_ofw: {
    type: Boolean,
    default: false
  },
  is_kasambahay: {
    type: Boolean,
    default: false
  },
  tags: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'DECEASED'],
    default: 'ACTIVE'
  },
  archival_state: {
    type: String,
    enum: ['ACTIVE', 'ARCHIVED'],
    default: 'ACTIVE'
  },
  death_cause: {
    type: String,
    default: ''
  },
  death_date: {
    type: Date
  },
  archive_reason: {
    type: String,
    default: ''
  },
  archived_at: {
    type: Date
  },
  photo_file_id: {
    type: mongoose.Schema.Types.ObjectId
  },
  _mock: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  collection: 'residents'
});

// Virtual for full name
residentSchema.virtual('full_name').get(function() {
  const parts = [this.first_name, this.middle_name, this.last_name, this.extension].filter(Boolean);
  return parts.join(' ');
});

// Text index for searching by name
residentSchema.index({
  first_name: 'text',
  middle_name: 'text',
  last_name: 'text'
});

// Use the profiling_db connection instead of default connection
const Resident = profilingConnection.model('Resident', residentSchema);

export default Resident;
