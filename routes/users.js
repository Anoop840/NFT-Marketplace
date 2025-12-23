const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { validateRequest, schemas } = require("../middleware/validation");
const {
  getProfile,
  updateProfile,
  addFavorite,
  removeFavorite,
  getFavorites,
} = require("../controllers/userController");

router.get("/profile/:walletAddress", getProfile);
router.put(
  "/profile",
  protect,
  validateRequest(schemas.updateProfile),
  updateProfile
);
router.post("/favorites", protect, addFavorite);
router.delete("/favorites/:nftId", protect, removeFavorite);
router.get("/favorites", protect, getFavorites);

module.exports = router;
