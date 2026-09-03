//redis.service.js

import { redisClient } from "./redis.connector.js";

export const redisService = {
  async get(key) {
    return await redisClient.get(key);
  },

  async set(key, value, options = {}) {
    if (options.ttl) {
      return await redisClient.set(key, value, {
        EX: options.ttl,
      });
    }
    return await redisClient.set(key, value);
  },

  async del(key) {
    return await redisClient.del(key);
  },

  async exists(key) {
    return (await redisClient.exists(key)) === 1;
  },

  async expire(key, ttl) {
    return await redisClient.expire(key, ttl);
  },

  // Helpers JSON (os mais importantes)
  async getJson(key) {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  },

  async setJson(key, value, options = {}) {
    const stringified = JSON.stringify(value);

    if (options.ttl) {
      return await redisClient.set(key, stringified, {
        EX: options.ttl,
      });
    }

    return await redisClient.set(key, stringified);
  },
};
