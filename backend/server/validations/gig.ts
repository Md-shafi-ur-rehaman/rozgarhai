import { z } from 'zod';

// Create Gig Schema
export const createGigSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must not exceed 100 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000, 'Description must not exceed 2000 characters'),
  price: z.number().positive('Price must be positive').min(5, 'Minimum price is 5'),
  deliveryTime: z.number().int().positive('Delivery time must be positive').min(1, 'Minimum delivery time is 1 day'),
  revisions: z.number().int().nonnegative('Revisions must be non-negative').max(10, 'Maximum revisions is 10'),
  category: z.string().min(2, 'Category must be at least 2 characters'),
  subcategory: z.string().min(2, 'Subcategory must be at least 2 characters'),
  tags: z.array(z.string().min(2, 'Tag must be at least 2 characters')).min(1, 'At least one tag is required').max(10, 'Maximum 10 tags allowed'),
  images: z.array(z.string().url('Invalid image URL')).min(1, 'At least one image is required').max(5, 'Maximum 5 images allowed'),
  requirements: z.array(z.string().min(5, 'Requirement must be at least 5 characters')).min(1, 'At least one requirement is required').max(10, 'Maximum 10 requirements allowed')
});

// Update Gig Schema
export const updateGigSchema = createGigSchema.partial().extend({
  status: z.enum(['ACTIVE', 'PAUSED', 'DELETED']).optional()
});

// Order Gig Schema
export const orderGigSchema = z.object({
  requirements: z.string().min(20, 'Requirements must be at least 20 characters').max(1000, 'Requirements must not exceed 1000 characters'),
  deliveryTime: z.number().int().positive('Delivery time must be positive').min(1, 'Minimum delivery time is 1 day'),
  revisions: z.number().int().nonnegative('Revisions must be non-negative').max(10, 'Maximum revisions is 10')
});

// Gig Query Parameters Schema
export const gigQuerySchema = z.object({
  category: z.string().optional(),
  subcategory: z.string().optional(),
  minPrice: z.string().transform(val => Number(val)).optional(),
  maxPrice: z.string().transform(val => Number(val)).optional(),
  search: z.string().optional(),
  sort: z.enum(['price', 'rating', 'date']).optional()
});

// Order Query Parameters Schema
export const orderQuerySchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  role: z.enum(['client', 'freelancer']).optional()
}); 