const mongoose = require("mongoose");
const transactionSchema = new mongoose.Schema({
  transactionHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  blockNumber: Number,
  from: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },
  to: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },
  nftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "NFT",
  },
  tokenId: String,
  contractAddress: {
    type: String,
    lowercase: true,
  },
  type: {
    type: String,
    enum: ["mint", "transfer", "sale", "listing", "delisting", "bid", "offer"],
    required: true,
    index: true,
  },
  price: String,
  currency: String,
  gasUsed: String,
  gasPrice: String,
  status: {
    type: String,
    enum: ["pending", "confirmed", "failed"],
    default: "pending",
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model("Transaction", transactionSchema);
