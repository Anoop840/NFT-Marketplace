const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { validateRequest, schemas } = require("../middleware/validation");
const { cacheMiddleware } = require("../middleware/cache");
const {
  createNFT,
  getNFT,
  getNFTs,
  searchNFTs,
  updateNFT,
  verifyNFTOwnership,
  getNFTHistory,
  getTrendingNFTs,
} = require("../controllers/nftController");

router.post("/", protect, validateRequest(schemas.createNFT), createNFT);
router.get("/", cacheMiddleware(300), getNFTs);
router.get("/search", searchNFTs);
router.get("/trending", cacheMiddleware(600), getTrendingNFTs);
router.get("/:id", cacheMiddleware(60), getNFT);
router.put("/:id", protect, updateNFT);
router.get("/:id/verify", protect, verifyNFTOwnership);
router.get("/:id/history", cacheMiddleware(300), getNFTHistory);

module.exports = router;
