// controllers/authController.js
const jwt = require("jsonwebtoken");
const { ethers } = require("ethers");
const User = require("../models/User");

exports.getNonce = async (req, res, next) => {
  try {
    const { walletAddress } = req.params;

    if (!ethers.isAddress(walletAddress)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid wallet address" });
    }

    let user = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
    });

    if (!user) {
      user = await User.create({ walletAddress: walletAddress.toLowerCase() });
    } else {
      user.generateNonce();
      await user.save();
    }

    res.json({ success: true, nonce: user.nonce });
  } catch (error) {
    next(error);
  }
};

exports.verifySignature = async (req, res, next) => {
  try {
    const { walletAddress, signature } = req.body;

    if (!ethers.isAddress(walletAddress)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid wallet address" });
    }

    const user = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const message = `Sign this message to authenticate: ${user.nonce}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid signature" });
    }

    // Generate new nonce for next login
    user.generateNonce();
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, walletAddress: user.walletAddress },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRE,
      }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        username: user.username,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    next(error);
  }
};
