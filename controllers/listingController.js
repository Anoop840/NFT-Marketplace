// controllers/listingController.js
const Listing = require("../models/Listing");
const NFT = require("../models/NFT");
const Transaction = require("../models/Transaction");
const blockchainService = require("../services/blockchainService");
const emailService = require("../services/emailService");
const { clearCache } = require("../middleware/cache");

exports.createListing = async (req, res, next) => {
  try {
    const { nftId, price, listingType, auctionEndTime, transactionHash } =
      req.body;

    const nft = await NFT.findById(nftId);

    if (!nft) {
      return res.status(404).json({ success: false, message: "NFT not found" });
    }

    // Verify ownership
    const isOwner = await blockchainService.verifyOwnership(
      nft.contractAddress,
      nft.tokenId,
      req.user.walletAddress,
      nft.chain
    );

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "You do not own this NFT",
      });
    }

    // Check if already listed
    const existingListing = await Listing.findOne({
      nftId,
      status: "active",
    });

    if (existingListing) {
      return res.status(400).json({
        success: false,
        message: "NFT is already listed",
      });
    }

    // Create listing
    const listing = await Listing.create({
      nftId,
      tokenId: nft.tokenId,
      contractAddress: nft.contractAddress,
      seller: req.user.walletAddress,
      price,
      listingType: listingType || "fixed",
      auctionEndTime: listingType === "auction" ? auctionEndTime : null,
      transactionHash,
      status: "active",
    });

    // Update NFT
    nft.isListed = true;
    await nft.save();

    // Record transaction
    if (transactionHash) {
      await Transaction.create({
        transactionHash,
        from: req.user.walletAddress,
        to: nft.contractAddress,
        nftId: nft._id,
        tokenId: nft.tokenId,
        contractAddress: nft.contractAddress,
        type: "listing",
        price,
        status: "confirmed",
      });
    }

    // Clear cache
    await clearCache("listings*");
    await clearCache(`nft:${nftId}`);

    res.status(201).json({ success: true, listing });
  } catch (error) {
    next(error);
  }
};

exports.getListings = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      listingType,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = { status: "active" };

    if (listingType) query.listingType = listingType;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = minPrice;
      if (maxPrice) query.price.$lte = maxPrice;
    }

    const listings = await Listing.find(query)
      .populate("nftId")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Listing.countDocuments(query);

    res.json({
      success: true,
      listings,
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
};

exports.getListing = async (req, res, next) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id).populate("nftId");

    if (!listing) {
      return res
        .status(404)
        .json({ success: false, message: "Listing not found" });
    }

    res.json({ success: true, listing });
  } catch (error) {
    next(error);
  }
};

exports.updateListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { price, auctionEndTime } = req.body;

    const listing = await Listing.findById(id);

    if (!listing) {
      return res
        .status(404)
        .json({ success: false, message: "Listing not found" });
    }

    if (listing.seller !== req.user.walletAddress) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this listing",
      });
    }

    if (listing.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Cannot update inactive listing",
      });
    }

    if (price) listing.price = price;
    if (auctionEndTime && listing.listingType === "auction") {
      listing.auctionEndTime = auctionEndTime;
    }
    listing.updatedAt = Date.now();

    await listing.save();

    // Clear cache
    await clearCache(`listing:${id}`);

    res.json({ success: true, listing });
  } catch (error) {
    next(error);
  }
};

exports.cancelListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { transactionHash } = req.body;

    const listing = await Listing.findById(id).populate("nftId");

    if (!listing) {
      return res
        .status(404)
        .json({ success: false, message: "Listing not found" });
    }

    if (listing.seller !== req.user.walletAddress) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this listing",
      });
    }

    listing.status = "cancelled";
    listing.updatedAt = Date.now();
    await listing.save();

    // Update NFT
    const nft = listing.nftId;
    nft.isListed = false;
    await nft.save();

    // Record transaction
    if (transactionHash) {
      await Transaction.create({
        transactionHash,
        from: req.user.walletAddress,
        to: nft.contractAddress,
        nftId: nft._id,
        tokenId: nft.tokenId,
        contractAddress: nft.contractAddress,
        type: "delisting",
        status: "confirmed",
      });
    }

    // Clear cache
    await clearCache("listings*");
    await clearCache(`nft:${nft._id}`);

    res.json({ success: true, message: "Listing cancelled" });
  } catch (error) {
    next(error);
  }
};

exports.buyNFT = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { transactionHash } = req.body;

    const listing = await Listing.findById(id).populate("nftId");

    if (!listing) {
      return res
        .status(404)
        .json({ success: false, message: "Listing not found" });
    }

    if (listing.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Listing is not active",
      });
    }

    if (listing.listingType !== "fixed") {
      return res.status(400).json({
        success: false,
        message: "This is an auction listing, not a fixed price sale",
      });
    }

    // Verify transaction
    if (transactionHash) {
      const txDetails = await blockchainService.monitorTransaction(
        transactionHash,
        listing.nftId.chain
      );

      if (!txDetails.success) {
        return res.status(400).json({
          success: false,
          message: "Transaction failed",
        });
      }
    }

    // Update listing
    listing.status = "sold";
    listing.updatedAt = Date.now();
    await listing.save();

    // Update NFT
    const nft = listing.nftId;
    nft.owner = req.user.walletAddress;
    nft.isListed = false;
    await nft.save();

    // Record transaction
    if (transactionHash) {
      await Transaction.create({
        transactionHash,
        from: req.user.walletAddress,
        to: listing.seller,
        nftId: nft._id,
        tokenId: nft.tokenId,
        contractAddress: nft.contractAddress,
        type: "sale",
        price: listing.price,
        currency: listing.currency,
        status: "confirmed",
      });
    }

    // Send notifications
    const sellerUser = await require("../models/User").findOne({
      walletAddress: listing.seller,
    });
    if (sellerUser && sellerUser.email) {
      await emailService.sendNFTSoldNotification(
        sellerUser.email,
        nft.name,
        listing.price
      );
    }

    if (req.user.email) {
      await emailService.sendNFTPurchaseConfirmation(
        req.user.email,
        nft.name,
        listing.price
      );
    }

    // Clear cache
    await clearCache("listings*");
    await clearCache(`nft:${nft._id}`);

    res.json({
      success: true,
      message: "NFT purchased successfully",
      nft,
    });
  } catch (error) {
    next(error);
  }
};

exports.placeBid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { bidAmount, transactionHash } = req.body;

    const listing = await Listing.findById(id).populate("nftId");

    if (!listing) {
      return res
        .status(404)
        .json({ success: false, message: "Listing not found" });
    }

    if (listing.listingType !== "auction") {
      return res.status(400).json({
        success: false,
        message: "This is not an auction listing",
      });
    }

    if (listing.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Auction is not active",
      });
    }

    if (new Date() > new Date(listing.auctionEndTime)) {
      return res.status(400).json({
        success: false,
        message: "Auction has ended",
      });
    }

    // Check if bid is higher than current highest
    const currentHighest = listing.highestBid || "0";
    if (parseFloat(bidAmount) <= parseFloat(currentHighest)) {
      return res.status(400).json({
        success: false,
        message: "Bid must be higher than current highest bid",
      });
    }

    listing.highestBid = bidAmount;
    listing.highestBidder = req.user.walletAddress;
    listing.updatedAt = Date.now();
    await listing.save();

    // Record transaction
    if (transactionHash) {
      await Transaction.create({
        transactionHash,
        from: req.user.walletAddress,
        to: listing.nftId.contractAddress,
        nftId: listing.nftId._id,
        tokenId: listing.tokenId,
        contractAddress: listing.contractAddress,
        type: "bid",
        price: bidAmount,
        status: "confirmed",
      });
    }

    // Notify seller
    const sellerUser = await require("../models/User").findOne({
      walletAddress: listing.seller,
    });
    if (sellerUser && sellerUser.email) {
      await emailService.sendBidNotification(
        sellerUser.email,
        listing.nftId.name,
        bidAmount
      );
    }

    res.json({ success: true, listing });
  } catch (error) {
    next(error);
  }
};
