import { z } from 'zod';

// User schemas
export const userSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: z.enum(['user', 'premium', 'admin']).default('user'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// File schemas
export const fileUploadSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number().max(10 * 1024 * 1024), // 10MB
  conversationId: z.string().optional(),
});

// Message schemas
export const messageSchema = z.object({
  content: z.string().min(1).max(5000),
  type: z.enum(['text', 'file', 'image', 'system']),
  conversationId: z.string(),
  files: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Thread schemas
export const threadSchema = z.object({
  parentMessageId: z.string(),
  content: z.string().min(1).max(5000),
  participants: z.array(z.string()),
});

// Category schemas
export const categorySchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(500).optional(),
  type: z.enum(['public', 'private', 'restricted']),
  members: z.array(z.string()).optional(),
});

// Search schemas
export const searchSchema = z.object({
  query: z.string().min(1).max(100),
  filters: z.record(z.unknown()).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Analytics schemas
export const analyticsSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  metrics: z.array(z.string()),
  groupBy: z.enum(['day', 'week', 'month', 'year']).optional(),
  filters: z.record(z.unknown()).optional(),
});

// Export schemas
export const exportSchema = z.object({
  format: z.enum(['csv', 'json', 'pdf', 'xlsx']),
  data: z.array(z.record(z.unknown())),
  options: z.record(z.unknown()).optional(),
});

// Validation error handler
export const handleValidationError = (error: z.ZodError) => {
  const formattedErrors = error.errors.map((err) => ({
    path: err.path.join('.'),
    message: err.message,
  }));

  return {
    status: 'error',
    message: 'Validation failed',
    errors: formattedErrors,
  };
}; 