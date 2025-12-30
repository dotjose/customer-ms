/**
 * Configuration for view tracking service
 */
export const ViewTrackingConfig = {
  // Bot detection
  botDetection: {
    rateLimitWindow: 60, // seconds
    rateLimitMax: 10, // max views per window
    dedupWindow: 300, // seconds (5 minutes)
  },

  // Cache TTLs
  cache: {
    viewCountTTL: 60, // seconds (1 minute)
    trendingTTL: 300, // seconds (5 minutes)
  },

  // Trending calculation
  trending: {
    defaultLimit: 10,
    maxLimit: 100,
    recencyDecayFactor: 0.9, // Exponential decay per day
  },

  // Entity types
  entityTypes: {
    product: 'product',
    realestate: 'realestate',
    job: 'job',
    professional: 'professional',
    event: 'event',
  },
};
