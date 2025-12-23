const User = require("../models/User");
const NFT = require("../models/NFT");

exports.getProfile = async (req, res, next) => {
  try {
    const { walletAddress } = req.params;

    const user = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
    }).select("-nonce");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Get user's NFTs
    const nfts = await NFT.find({ owner: walletAddress.toLowerCase() });
    const created = await NFT.find({ creator: walletAddress.toLowerCase() });

    res.json({
      success: true,
      user,
      stats: {
        owned: nfts.length,
        created: created.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { username, email, bio, profileImage, coverImage, socialLinks } =
      req.body;

    const user = await User.findById(req.user.id);

    if (username) user.username = username;
    if (email) user.email = email;
    if (bio) user.bio = bio;
    if (profileImage) user.profileImage = profileImage;
    if (coverImage) user.coverImage = coverImage;
    if (socialLinks) user.socialLinks = { ...user.socialLinks, ...socialLinks };

    await user.save();

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

exports.addFavorite = async (req, res, next) => {
  try {
    const { nftId } = req.body;

    const user = await User.findById(req.user.id);
    const nft = await NFT.findById(nftId);

    if (!nft) {
      return res.status(404).json({ success: false, message: "NFT not found" });
    }

    if (!user.favorites.includes(nftId)) {
      user.favorites.push(nftId);
      nft.likes += 1;
      nft.likedBy.push(user.walletAddress);

      await user.save();
      await nft.save();
    }

    res.json({ success: true, message: "Added to favorites" });
  } catch (error) {
    next(error);
  }
};

exports.removeFavorite = async (req, res, next) => {
  try {
    const { nftId } = req.params;

    const user = await User.findById(req.user.id);
    const nft = await NFT.findById(nftId);

    if (!nft) {
      return res.status(404).json({ success: false, message: "NFT not found" });
    }

    user.favorites = user.favorites.filter((id) => id.toString() !== nftId);
    nft.likes = Math.max(0, nft.likes - 1);
    nft.likedBy = nft.likedBy.filter((addr) => addr !== user.walletAddress);

    await user.save();
    await nft.save();

    res.json({ success: true, message: "Removed from favorites" });
  } catch (error) {
    next(error);
  }
};

exports.getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate("favorites");

    res.json({ success: true, favorites: user.favorites });
  } catch (error) {
    next(error);
  }
};
