const Joi = require("joi");

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    next();
  };
};

// Validation schemas
const schemas = {
  createNFT: Joi.object({
    name: Joi.string().required().min(1).max(100),
    description: Joi.string().max(1000),
    image: Joi.string().required(),
    attributes: Joi.array().items(
      Joi.object({
        trait_type: Joi.string().required(),
        value: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
      })
    ),
    category: Joi.string().valid(
      "art",
      "music",
      "photography",
      "gaming",
      "collectibles",
      "sports",
      "other"
    ),
    royaltyPercentage: Joi.number().min(0).max(50),
  }),

  createListing: Joi.object({
    nftId: Joi.string().required(),
    price: Joi.string().required(),
    listingType: Joi.string().valid("fixed", "auction").default("fixed"),
    auctionEndTime: Joi.date().when("listingType", {
      is: "auction",
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  }),

  updateProfile: Joi.object({
    username: Joi.string().min(3).max(30).alphanum(),
    email: Joi.string().email(),
    bio: Joi.string().max(500),
    socialLinks: Joi.object({
      twitter: Joi.string().uri(),
      instagram: Joi.string().uri(),
      website: Joi.string().uri(),
    }),
  }),
};

module.exports = { validateRequest, schemas };
