// server/models/propertyApplicationModel.js
import mongoose from 'mongoose';

const propertyApplicationSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  unitNumber: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  message: {
    type: String,
    default: ''
  }
}, { timestamps: true });

propertyApplicationSchema.index({ propertyId: 1, status: 1 });
propertyApplicationSchema.index({ tenantId: 1 });

export default mongoose.model('PropertyApplication', propertyApplicationSchema);
