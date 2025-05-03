import express from 'express';
import { getReviews, deleteReview, updateReviewStatus, createReview } from '../controllers/review.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
router.get('/', protect, authorize('admin', 'doctor'), getReviews);
router.post('/', protect, authorize('patient'), createReview);
router.delete('/:id', protect, authorize('admin'), deleteReview);
router.patch('/:id/status', protect, authorize('admin'), updateReviewStatus);

export default router;