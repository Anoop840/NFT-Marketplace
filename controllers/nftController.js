// controllers/nftController.js
const NFT = require("../models/NFT");
const Transaction = require("../models/Transaction");
const { uploadToIPFS, uploadJSONToIPFS } = require("../config/ipfs");
const blockchainService = require("../services/blockchainService");
const searchService = require("../services/searchService");
const { clearCache } = require("../middleware/cache");

exports.createNFT = async (req, res, next) => {
  try {
    const {
      name,
      description,
      image,
      attributes,
      category,
      royaltyPercentage,
      tokenId,
      contractAddress,
      chain = "polygon",
    } = req.body;

    // Check if NFT already exists
    const existingNFT = await NFT.findOne({
      tokenId,
      contractAddress: contractAddress.toLowerCase(),
    });

    if (existingNFT) {
      return res.status(400).json({
        success: false,
        message: "NFT already indexed",
      });
    }

    // Upload metadata to IPFS
    const metadata = {
      name,
      description,
      image,
      attributes: attributes || [],
    };

    const { url: metadataUri } = await uploadJSONToIPFS(metadata);

    // Create NFT in database
    const nft = await NFT.create({
      tokenId,
      contractAddress: contractAddress.toLowerCase(),
      chain,
      name,
      description,
      image,
      metadataUri,
      attributes: attributes || [],
      creator: req.user.walletAddress,
      owner: req.user.walletAddress,
      royaltyPercentage: royaltyPercentage || 0,
      category: category || "other",
    });

    // Clear cache
    await clearCache("nfts*");

    res.status(201).json({
      success: true,
      nft,
      metadataUri,
    });
  } catch (error) {
    next(error);
  }
};

exports.getNFT = async (req, res, next) => {
  try {
    const { id } = req.params;

    const nft = await NFT.findById(id);

    if (!nft) {
      return res.status(404).json({
        success: false,
        message: "NFT not found",
      });
    }

    // Increment view count
    nft.views += 1;
    await nft.save();

    // Get active listing if exists
    const Listing = require("../models/Listing");
    const listing = await Listing.findOne({
      nftId: nft._id,
      status: "active",
    });

    res.json({
      success: true,
      nft,
      listing,
    });
  } catch (error) {
    next(error);
  }
};

exports.getNFTs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      chain,
      owner,
      creator,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    if (category) query.category = category;
    if (chain) query.chain = chain;
    if (owner) query.owner = owner.toLowerCase();
    if (creator) query.creator = creator.toLowerCase();

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 },
      lean: true,
    };

    const nfts = await NFT.find(query)
      .sort(options.sort)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit);

    const total = await NFT.countDocuments(query);

    res.json({
      success: true,
      nfts,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.searchNFTs = async (req, res, next) => {
  try {
    const { query, ...filters } = req.query;

    const results = await searchService.searchNFTs(query, filters);

    res.json({
      success: true,
      ...results,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateNFT = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, category } = req.body;

    const nft = await NFT.findById(id);

    if (!nft) {
      return res.status(404).json({
        success: false,
        message: "NFT not found",
      });
    }

    // Only creator can update
    if (nft.creator !== req.user.walletAddress) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this NFT",
      });
    }

    if (name) nft.name = name;
    if (description) nft.description = description;
    if (category) nft.category = category;
    nft.updatedAt = Date.now();

    await nft.save();

    // Clear cache
    await clearCache(`nft:${id}`);

    res.json({
      success: true,
      nft,
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyNFTOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;

    const nft = await NFT.findById(id);

    if (!nft) {
      return res.status(404).json({
        success: false,
        message: "NFT not found",
      });
    }

    const isOwner = await blockchainService.verifyOwnership(
      nft.contractAddress,
      nft.tokenId,
      req.user.walletAddress,
      nft.chain
    );

    if (isOwner && nft.owner !== req.user.walletAddress) {
      // Update owner in database
      nft.owner = req.user.walletAddress;
      await nft.save();
    }

    res.json({
      success: true,
      isOwner,
    });
  } catch (error) {
    next(error);
  }
};

exports.getNFTHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const nft = await NFT.findById(id);

    if (!nft) {
      return res.status(404).json({
        success: false,
        message: "NFT not found",
      });
    }

    const history = await Transaction.find({
      contractAddress: nft.contractAddress,
      tokenId: nft.tokenId,
    })
      .sort({ timestamp: -1 })
      .limit(50);

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    next(error);
  }
};

exports.getTrendingNFTs = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    // Get NFTs with most views in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const trending = await NFT.find({
      createdAt: { $gte: sevenDaysAgo },
    })
      .sort({ views: -1, likes: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      trending,
    });
  } catch (error) {
    next(error);
  }
};
