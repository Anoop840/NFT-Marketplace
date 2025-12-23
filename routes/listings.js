const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { validateRequest, schemas } = require("../middleware/validation");
const { cacheMiddleware } = require("../middleware/cache");
const {
  createListing,
  getListings,
  getListing,
  updateListing,
  cancelListing,
  buyNFT,
  placeBid,
} = require("../controllers/listingController");

router.post(
  "/",
  protect,
  validateRequest(schemas.createListing),
  createListing
);
router.get("/", cacheMiddleware(60), getListings);
router.get("/:id", cacheMiddleware(60), getListing);
router.put("/:id", protect, updateListing);
router.delete("/:id", protect, cancelListing);
router.post("/:id/buy", protect, buyNFT);
router.post("/:id/bid", protect, placeBid);

module.exports = router;
