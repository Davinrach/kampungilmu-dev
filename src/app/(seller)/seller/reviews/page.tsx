"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { sellerService, SellerBook } from "@/services/sellerService";
import {
  reviewService,
  Review,
  formatReviewDate,
} from "@/services/reviewService";

interface ReviewWithBook extends Review {
  book_title?: string;
  book_cover?: string;
}

export default function SellerReviewsPage() {
  const toast = useToast();

  const [books, setBooks] = useState<SellerBook[]>([]);
  const [reviews, setReviews] = useState<ReviewWithBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<"all" | "unreplied" | "replied">("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      // First get seller's books
      const booksData = await sellerService.getMyBooks();
      setBooks(booksData);

      // Then fetch reviews for each book
      const allReviews: ReviewWithBook[] = [];
      for (const book of booksData) {
        try {
          const bookReviews = await reviewService.getBookReviews(book.id);
          const reviewsWithBook = bookReviews.reviews.map((review) => ({
            ...review,
            book_id: book.id,
            book_title: book.title,
            book_cover: book.cover_photo,
          }));
          allReviews.push(...reviewsWithBook);
        } catch (err) {
          // Skip if no reviews for this book
        }
      }

      // Sort by created_at descending
      allReviews.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setReviews(allReviews);
    } catch (err: any) {
      console.error("Failed to fetch data:", err);
      toast.error("Gagal memuat data ulasan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) {
      toast.warning("Silakan tulis balasan");
      return;
    }

    setSubmitting(true);
    try {
      await reviewService.replyToReview(reviewId, { reply: replyText.trim() });
      toast.success("Balasan berhasil dikirim!");
      setReplyingTo(null);
      setReplyText("");
      // Refresh reviews
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengirim balasan");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    if (filter === "unreplied") return !review.seller_reply;
    if (filter === "replied") return !!review.seller_reply;
    return true;
  });

  const unrepliedCount = reviews.filter((r) => !r.seller_reply).length;

  // Calculate average rating
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ulasan Pembeli</h1>
          <p className="text-gray-500">Kelola dan balas ulasan dari pembeli</p>
        </div>
        {unrepliedCount > 0 && (
          <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-xl font-semibold text-sm">
            {unrepliedCount} ulasan belum dibalas
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Total Ulasan</p>
          <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Rating Rata-rata</p>
          <div className="flex items-center gap-1">
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 13.187l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.566 7.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-2xl font-bold text-gray-900">{avgRating.toFixed(1)}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Belum Dibalas</p>
          <p className="text-2xl font-bold text-yellow-600">{unrepliedCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Sudah Dibalas</p>
          <p className="text-2xl font-bold text-green-600">{reviews.length - unrepliedCount}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 p-1 inline-flex">
        {[
          { key: "all", label: "Semua", count: reviews.length },
          { key: "unreplied", label: "Belum Dibalas", count: unrepliedCount },
          { key: "replied", label: "Sudah Dibalas", count: reviews.length - unrepliedCount },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as typeof filter)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              filter === tab.key
                ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {filter === "all"
              ? "Belum ada ulasan"
              : filter === "unreplied"
              ? "Semua ulasan sudah dibalas"
              : "Belum ada ulasan yang dibalas"}
          </h3>
          <p className="text-gray-500">
            {filter === "all" ? "Ulasan dari pembeli akan muncul di sini" : ""}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
            >
              {/* Book Info */}
              <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-gray-50">
                <div className="w-12 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {review.book_cover ? (
                    <img
                      src={review.book_cover}
                      alt={review.book_title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/books/${review.book_id}`}
                    className="font-semibold text-gray-900 hover:text-teal-600 truncate block"
                  >
                    {review.book_title || "Buku"}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {formatReviewDate(review.created_at)}
                  </p>
                </div>
                {!review.seller_reply && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                    Belum dibalas
                  </span>
                )}
              </div>

              {/* Review Content */}
              <div className="p-4">
                <div className="flex items-start gap-3">
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
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{review.user_name}</p>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                            }`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 13.187l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.566 7.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                    )}
                    {review.photo_url && (
                      <div className="mt-2">
                        <img
                          src={review.photo_url}
                          alt="Review photo"
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Seller Reply */}
                {review.seller_reply ? (
                  <div className="mt-4 ml-13 p-4 bg-teal-50 rounded-xl border-l-4 border-teal-500">
                    <p className="text-xs font-bold text-teal-700 mb-1">Balasan Anda</p>
                    <p className="text-sm text-gray-700">{review.seller_reply}</p>
                  </div>
                ) : replyingTo === review.id ? (
                  <div className="mt-4 ml-13">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Tulis balasan Anda..."
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm resize-none"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText("");
                        }}
                        disabled={submitting}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-semibold transition"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => handleReply(review.id)}
                        disabled={submitting || !replyText.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg text-sm font-semibold hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 transition flex items-center gap-2"
                      >
                        {submitting ? (
                          <>
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            Mengirim...
                          </>
                        ) : (
                          "Kirim Balasan"
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 ml-13">
                    <button
                      onClick={() => setReplyingTo(review.id)}
                      className="text-teal-600 hover:text-teal-700 text-sm font-semibold flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Balas Ulasan
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
