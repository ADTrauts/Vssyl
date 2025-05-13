import rateLimit from 'express-rate-limit';

const createLimiter = (windowMs: number, max: number) => rateLimit({
  windowMs,
  max,
  message: { error: 'Too many requests, please try again later.' }
});

// 100 requests per 15 minutes
export const contentPerformanceLimiter = createLimiter(15 * 60 * 1000, 100);

// 50 requests per 15 minutes
export const customReportLimiter = createLimiter(15 * 60 * 1000, 50);

// 200 requests per 15 minutes
export const engagementHeatmapLimiter = createLimiter(15 * 60 * 1000, 200);

// 100 requests per 15 minutes
export const segmentationLimiter = createLimiter(15 * 60 * 1000, 100);

// 50 requests per 15 minutes
export const exportLimiter = createLimiter(15 * 60 * 1000, 50);

// 200 requests per 15 minutes
export const visualizationLimiter = createLimiter(15 * 60 * 1000, 200); 