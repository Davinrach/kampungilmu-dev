"use client";

import { useState, useEffect } from "react";
import {
  reviewService,
  Review,
  BookReviewsResponse,
  formatReviewDate,
} from "@/services/reviewService";

interface BookReviewsProps {
  bookId: string;
}

export default function BookReviews({ bookId }: BookReviewsProps) {
  const [data, setData] = useState<BookReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!bookId) return;

    setLoading(true);
    setError(null);

    reviewService
      .getBookReviews(bookId)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error("Failed to fetch reviews:", err);
        // Don't show error if just no reviews
        if (err.response?.status !== 404) {
          setError("Gagal memuat ulasan");
        }
      })
      .finally(() => setLoading(false));
  }, [bookId]);

  if (loading) {
    return <ReviewsSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-sm text-gray-500 text-center">{error}</p>
      </div>
    );
  }

  if (!data || data.total_reviews === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
          Ulasan Pembeli
        </h2>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">Belum ada ulasan untuk buku ini</p>
          <p className="text-gray-400 text-xs mt-1">
            Jadilah yang pertama memberikan ulasan!
          </p>
        </div>
      </div>
    );
  }

  const displayedReviews = showAll ? data.reviews : data.reviews.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
          Ulasan Pembeli
        </h2>
        <span className="text-xs text-gray-500">
          {data.total_reviews} ulasan
        </span>
      </div>

      {/* Rating Summary */}
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl mb-5">
        <div className="text-center">
          <p className="text-4xl font-bold text-gray-900">
            {data.average_rating.toFixed(1)}
          </p>
          <div className="flex items-center justify-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(data.average_rating)
                    ? "text-yellow-400 fill-current"
                    : "text-gray-300"
                }`}
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 13.187l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.566 7.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <RatingBar rating={5} count={countByRating(data.reviews, 5)} total={data.total_reviews} />
          <RatingBar rating={4} count={countByRating(data.reviews, 4)} total={data.total_reviews} />
          <RatingBar rating={3} count={countByRating(data.reviews, 3)} total={data.total_reviews} />
          <RatingBar rating={2} count={countByRating(data.reviews, 2)} total={data.total_reviews} />
          <RatingBar rating={1} count={countByRating(data.reviews, 1)} total={data.total_reviews} />
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {displayedReviews.map((review) => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </div>

      {/* Show More Button */}
      {data.reviews.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-4 py-2.5 text-sm font-semibold text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition"
        >
          {showAll
            ? "Tampilkan Lebih Sedikit"
            : `Lihat Semua ${data.total_reviews} Ulasan`}
        </button>
      )}
    </div>
  );
}

// ============== SUB COMPONENTS ==============

function ReviewItem({ review }: { review: Review }) {
  const [showFullComment, setShowFullComment] = useState(false);
  const isLongComment = review.comment && review.comment.length > 200;

  return (
    <div className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
          {review.user_photo ? (
            <img
              src={review.user_photo}
              alt={review.user_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white font-bold text-sm">
              {review.user_name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="font-semibold text-gray-900 text-sm truncate">
              {review.user_name}
            </p>
            <span className="text-xs text-gray-400 flex-shrink-0">
              {formatReviewDate(review.created_at)}
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-0.5 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-3.5 h-3.5 ${
                  star <= review.rating
                    ? "text-yellow-400 fill-current"
                    : "text-gray-300"
                }`}
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 13.187l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.566 7.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>

          {/* Comment */}
          {review.comment && (
            <p className="text-sm text-gray-700 leading-relaxed">
              {isLongComment && !showFullComment
                ? `${review.comment.slice(0, 200)}...`
                : review.comment}
              {isLongComment && (
                <button
                  onClick={() => setShowFullComment(!showFullComment)}
                  className="ml-1 text-teal-600 hover:text-teal-700 font-medium"
                >
                  {showFullComment ? "Sembunyikan" : "Selengkapnya"}
                </button>
              )}
            </p>
          )}

          {/* Photo */}
          {review.photo_url && (
            <div className="mt-2">
              <img
                src={review.photo_url}
                alt="Review photo"
                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
              />
            </div>
          )}

          {/* Seller Reply */}
          {review.seller_reply && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border-l-2 border-teal-500">
              <p className="text-xs font-semibold text-teal-700 mb-1">
                Balasan Penjual
              </p>
              <p className="text-sm text-gray-700">{review.seller_reply}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RatingBar({
  rating,
  count,
  total,
}: {
  rating: number;
  count: number;
  total: number;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-3 text-gray-600">{rating}</span>
      <svg className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 13.187l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.566 7.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-6 text-gray-500 text-right">{count}</span>
    </div>
  );
}

function ReviewsSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
      <div className="flex items-center gap-4 p-4 bg-gray-100 rounded-xl mb-5">
        <div className="w-16 h-16 bg-gray-200 rounded"></div>
        <div className="flex-1 space-y-2">
          <div className="h-2 bg-gray-200 rounded"></div>
          <div className="h-2 bg-gray-200 rounded"></div>
          <div className="h-2 bg-gray-200 rounded"></div>
        </div>
      </div>
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-24"></div>
              <div className="h-2 bg-gray-200 rounded w-16"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function
function countByRating(reviews: Review[], rating: number): number {
  return reviews.filter((r) => r.rating === rating).length;
}
