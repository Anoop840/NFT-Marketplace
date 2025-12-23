const { getRedisClient } = require("../config/redis");

const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    if (req.method !== "GET") {
      return next();
    }

    const redis = getRedisClient();
    if (!redis) {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      const cachedData = await redis.get(key);

      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }

      // Store original json function
      const originalJson = res.json.bind(res);

      // Override json function
      res.json = (data) => {
        redis.setEx(key, duration, JSON.stringify(data)).catch(console.error);
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error("Cache error:", error);
      next();
    }
  };
};

const clearCache = async (pattern) => {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const keys = await redis.keys(`cache:${pattern}`);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (error) {
    console.error("Clear cache error:", error);
  }
};

module.exports = { cacheMiddleware, clearCache };
