const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    enum: ['Farmer', 'NGO', 'Admin', 'SuperAdmin'],
    required: true
  },
  roleData: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'role', // Dynamically reference 'Farmer', 'NGO', etc. collections
  },
  approved: {
    type: Boolean,
    default: false
  },
  walletAddress: {
    type: String,
    default: ''
  },
  walletBalance: {
    type: Number,
    default: 0
  },
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

// Generate auth token
userSchema.methods.generateAuthToken = async function() {
  const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  this.tokens = this.tokens.concat({ token });
  await this.save();
  return token;
};

// Compare password
userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

// Remove sensitive data
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.tokens;
  return user;
};

module.exports = mongoose.model('User', userSchema);
