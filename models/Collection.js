const mongoose = require("mongoose");
const collectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  symbol: String,
  contractAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  creator: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },
  image: String,
  banner: String,
  category: String,
  royaltyPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 50,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  totalSupply: {
    type: Number,
    default: 0,
  },
  floorPrice: String,
  volume: {
    type: String,
    default: "0",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Collection", collectionSchema);
