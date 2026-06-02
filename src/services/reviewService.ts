import api from '@/lib/api';

// ============== TYPES ==============

export interface Review {
  id: string;
  user_name: string;
  user_photo?: string;
  rating: number;
  comment: string;
  photo_url?: string;
  seller_reply?: string;
  created_at: string;
  // Extended fields for seller view
  book_id?: string;
  book_title?: string;
  book_cover?: string;
}

export interface BookReviewsResponse {
  average_rating: number;
  total_reviews: number;
  reviews: Review[];
}

export interface CreateReviewPayload {
  order_id: string;
  book_id: string;
  rating: number;
  comment?: string;
  photo_url?: string;
}

export interface ReplyReviewPayload {
  reply: string;
}

export interface UpdateReviewPayload {
  rating?: number;
  comment?: string;
  photo_url?: string;
}

export interface ReportReviewPayload {
  reason: string;
}

export interface ReviewReport {
  id: string;
  review_id: string;
  reporter_id: string;
  reason: string;
  status: 'pending' | 'reviewed';
  admin_note?: string;
  created_at: string;
  resolved_at?: string;
}

interface BackendResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ============== SERVICE ==============

export const reviewService = {
  /**
   * Get all reviews for a book (Public)
   * GET /api/v1/reviews/book/:bookId
   */
  getBookReviews: async (bookId: string): Promise<BookReviewsResponse> => {
    const response = await api.get<BackendResponse<BookReviewsResponse>>(
      `/reviews/book/${bookId}`
    );
    return response.data.data;
  },

  /**
   * Create a review for a book (Customer, after order completed)
   * POST /api/v1/reviews
   */
  createReview: async (payload: CreateReviewPayload): Promise<Review> => {
    const response = await api.post<BackendResponse<Review>>('/reviews', payload);
    return response.data.data;
  },

  /**
   * Reply to a review (Seller only)
   * POST /api/v1/reviews/:id/reply
   */
  replyToReview: async (reviewId: string, payload: ReplyReviewPayload): Promise<void> => {
    await api.post(`/reviews/${reviewId}/reply`, payload);
  },

  /**
   * Update a review (Customer)
   * PATCH /api/v1/reviews/:id
   */
  updateReview: async (reviewId: string, payload: UpdateReviewPayload): Promise<Review> => {
    const response = await api.patch<BackendResponse<Review>>(`/reviews/${reviewId}`, payload);
    return response.data.data;
  },

  /**
   * Delete a review (Customer)
   * DELETE /api/v1/reviews/:id
   */
  deleteReview: async (reviewId: string): Promise<void> => {
    await api.delete(`/reviews/${reviewId}`);
  },

  /**
   * Report a review
   * POST /api/v1/reviews/:id/report
   */
  reportReview: async (reviewId: string, payload: ReportReviewPayload): Promise<ReviewReport> => {
    const response = await api.post<BackendResponse<ReviewReport>>(`/reviews/${reviewId}/report`, payload);
    return response.data.data;
  },

  // ===== ADMIN ENDPOINTS =====

  /**
   * Get list of review reports (Admin)
   * GET /api/v1/admin/review-reports
   */
  getReviewReports: async (): Promise<ReviewReport[]> => {
    const response = await api.get<BackendResponse<ReviewReport[]>>('/admin/review-reports');
    return response.data.data;
  },

  /**
   * Resolve a review report (Admin)
   * POST /api/v1/admin/review-reports/:id/resolve
   */
  resolveReviewReport: async (reportId: string, status: 'reviewed', adminNote: string): Promise<ReviewReport> => {
    const response = await api.post<BackendResponse<ReviewReport>>(`/admin/review-reports/${reportId}/resolve`, {
      status,
      admin_note: adminNote,
    });
    return response.data.data;
  },

  /**
   * Get reviews for multiple books (for seller dashboard)
   * This fetches reviews for each book and combines them
   */
  getReviewsForBooks: async (bookIds: string[]): Promise<Review[]> => {
    const allReviews: Review[] = [];
    
    for (const bookId of bookIds) {
      try {
        const response = await api.get<BackendResponse<BookReviewsResponse>>(
          `/reviews/book/${bookId}`
        );
        const bookReviews = response.data.data.reviews.map(review => ({
          ...review,
          book_id: bookId,
        }));
        allReviews.push(...bookReviews);
      } catch (err) {
        // Skip if no reviews for this book
        console.log(`No reviews for book ${bookId}`);
      }
    }
    
    // Sort by created_at descending
    return allReviews.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },
};

// ============== HELPERS ==============

export const formatReviewDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const getRatingLabel = (rating: number): string => {
  if (rating >= 4.5) return 'Sangat Bagus';
  if (rating >= 4) return 'Bagus';
  if (rating >= 3) return 'Cukup';
  if (rating >= 2) return 'Kurang';
  return 'Buruk';
};

export const getRatingColor = (rating: number): string => {
  if (rating >= 4) return 'text-green-600';
  if (rating >= 3) return 'text-yellow-600';
  if (rating >= 2) return 'text-orange-600';
  return 'text-red-600';
};
