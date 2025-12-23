const express = require("express");
const router = express.Router();
const { cacheMiddleware } = require("../middleware/cache");
const Transaction = require("../models/Transaction");

// Get all transactions
router.get("/", cacheMiddleware(60), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, walletAddress } = req.query;

    const query = {};
    if (type) query.type = type;
    if (walletAddress) {
      query.$or = [
        { from: walletAddress.toLowerCase() },
        { to: walletAddress.toLowerCase() },
      ];
    }

    const transactions = await Transaction.find(query)
      .populate("nftId")
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      transactions,
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

// Get transaction by hash
router.get("/:hash", cacheMiddleware(300), async (req, res, next) => {
  try {
    const { hash } = req.params;

    const transaction = await Transaction.findOne({
      transactionHash: hash,
    }).populate("nftId");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.json({ success: true, transaction });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
