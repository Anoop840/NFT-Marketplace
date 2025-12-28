const mongoose = require("mongoose");
const nftSchema = new mongoose.Schema({
  tokenId: {
    type: String,
    required: true,
    index: true,
  },
  contractAddress: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },
  chain: {
    type: String,
    enum: ["ethereum", "polygon", "goerli"],
    default: "polygon",
  },
  name: {
    type: String,
    required: true,
  },
  description: String,
  image: {
    type: String,
    required: true,
  },
  imageIpfs: String,
  animationUrl: String,
  metadataUri: String,
  attributes: [
    {
      trait_type: String,
      value: mongoose.Schema.Types.Mixed,
    },
  ],
  creator: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },
  owner: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },
  royaltyPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 50,
  },
  category: {
    type: String,
    enum: [
      "art",
      "music",
      "photography",
      "gaming",
      "collectibles",
      "sports",
      "other",
    ],
    default: "other",
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: {
    type: Number,
    default: 0,
  },
  likedBy: [
    {
      type: String,
      lowercase: true,
    },
  ],
  isListed: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

nftSchema.index({ tokenId: 1, contractAddress: 1 }, { unique: true });
nftSchema.index({ name: "text", description: "text" });

module.exports = new mongoose.model("NFT", nftSchema);
