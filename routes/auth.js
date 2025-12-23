// routes/auth.js
const express = require("express");
const router = express.Router();
const { getNonce, verifySignature } = require("../controllers/authController");

router.get("/nonce/:walletAddress", getNonce);
router.post("/verify", verifySignature);

module.exports = router;
