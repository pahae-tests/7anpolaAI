// /api/_models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  msgs: [{
    sender: { type: String, required: true },
    content: { type: String, required: true },
    created_At: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
