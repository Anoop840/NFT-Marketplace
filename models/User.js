// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true,
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  bio: String,
  profileImage: String,
  coverImage: String,
  socialLinks: {
    twitter: String,
    instagram: String,
    website: String,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  nonce: {
    type: String,
    default: () => Math.floor(Math.random() * 1000000).toString(),
  },
  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NFT",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.methods.generateNonce = function () {
  this.nonce = Math.floor(Math.random() * 1000000).toString();
  return this.nonce;
};

module.exports = mongoose.model("User", userSchema);
