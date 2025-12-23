const NFT = require("../models/NFT");

class SearchService {
  async searchNFTs(query, filters = {}) {
    const {
      category,
      minPrice,
      maxPrice,
      chain,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 20,
    } = filters;

    const searchQuery = {};

    // Text search
    if (query) {
      searchQuery.$text = { $search: query };
    }

    // Category filter
    if (category) {
      searchQuery.category = category;
    }

    // Chain filter
    if (chain) {
      searchQuery.chain = chain;
    }

    // Price range (requires joining with Listing)
    const aggregationPipeline = [
      { $match: searchQuery },
      {
        $lookup: {
          from: "listings",
          let: { nftId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$nftId", "$$nftId"] },
                status: "active",
              },
            },
          ],
          as: "listing",
        },
      },
    ];

    // Price filter
    if (minPrice || maxPrice) {
      const priceMatch = {};
      if (minPrice) priceMatch.$gte = minPrice;
      if (maxPrice) priceMatch.$lte = maxPrice;

      aggregationPipeline.push({
        $match: { "listing.price": priceMatch },
      });
    }

    // Sort
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    aggregationPipeline.push({ $sort: sortOptions });

    // Pagination
    aggregationPipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });

    try {
      const nfts = await NFT.aggregate(aggregationPipeline);
      const total = await NFT.countDocuments(searchQuery);

      return {
        nfts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Search NFTs error:", error);
      throw error;
    }
  }

  async getFilterOptions() {
    try {
      const categories = await NFT.distinct("category");
      const chains = await NFT.distinct("chain");

      return { categories, chains };
    } catch (error) {
      console.error("Get filter options error:", error);
      throw error;
    }
  }
}

module.exports = new SearchService();
