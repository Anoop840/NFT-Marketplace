const listingSchema = new mongoose.Schema({
  nftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "NFT",
    required: true,
    index: true,
  },
  tokenId: {
    type: String,
    required: true,
  },
  contractAddress: {
    type: String,
    required: true,
    lowercase: true,
  },
  seller: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },
  price: {
    type: String,
    required: true,
  },
  currency: {
    type: String,
    default: "ETH",
  },
  listingType: {
    type: String,
    enum: ["fixed", "auction"],
    default: "fixed",
  },
  auctionEndTime: Date,
  highestBid: String,
  highestBidder: String,
  status: {
    type: String,
    enum: ["active", "sold", "cancelled", "expired"],
    default: "active",
    index: true,
  },
  transactionHash: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Listing", listingSchema);
