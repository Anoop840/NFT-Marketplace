const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { cacheMiddleware } = require("../middleware/cache");
const Collection = require("../models/Collection");
const NFT = require("../models/NFT");

// Get all collections
router.get("/", cacheMiddleware(300), async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = "volume",
      sortOrder = "desc",
    } = req.query;

    const collections = await Collection.find()
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Collection.countDocuments();

    res.json({
      success: true,
      collections,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get collection by address
router.get("/:address", cacheMiddleware(300), async (req, res, next) => {
  try {
    const { address } = req.params;

    const collection = await Collection.findOne({
      contractAddress: address.toLowerCase(),
    });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    // Get collection NFTs
    const nfts = await NFT.find({
      contractAddress: address.toLowerCase(),
    }).limit(12);

    res.json({ success: true, collection, nfts });
  } catch (error) {
    next(error);
  }
});

// Create collection
router.post("/", protect, async (req, res, next) => {
  try {
    const {
      name,
      description,
      symbol,
      contractAddress,
      image,
      banner,
      category,
      royaltyPercentage,
    } = req.body;

    const collection = await Collection.create({
      name,
      description,
      symbol,
      contractAddress: contractAddress.toLowerCase(),
      creator: req.user.walletAddress,
      image,
      banner,
      category,
      royaltyPercentage: royaltyPercentage || 0,
    });

    res.status(201).json({ success: true, collection });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
