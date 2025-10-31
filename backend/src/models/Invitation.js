import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['Collaborator', 'Member', 'Viewer'],
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 72 * 60 * 60 * 1000) // 72 часа
  }
}, {
  timestamps: true
});

// Индексы
invitationSchema.index({ token: 1 });
invitationSchema.index({ project: 1, email: 1 });
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL индекс для автоудаления

// Метод для проверки истечения срока
invitationSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt || this.status === 'expired';
};

const Invitation = mongoose.model('Invitation', invitationSchema);

export default Invitation;
