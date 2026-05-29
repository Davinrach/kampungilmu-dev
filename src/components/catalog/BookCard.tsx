"use client";

import Link from "next/link";
import {
  Book,
  formatPrice,
  getConditionLabel,
  getConditionColor,
  getPrimaryPhoto,
  PLACEHOLDER_IMAGE,
} from "@/services/catalogService";

interface BookCardProps {
  book: Book;
  view?: "grid" | "list";
}

export default function BookCard({ book, view = "grid" }: BookCardProps) {
  if (view === "list") {
    return <BookCardList book={book} />;
  }
  return <BookCardGrid book={book} />;
}

function BookCardGrid({ book }: { book: Book }) {
  const stock = book.stock ?? 0;
  const isOutOfStock = stock === 0;
  const photo = getPrimaryPhoto(book);
  const rating = book.rating ?? 0;
  const totalSold = book.total_sold ?? 0;

  return (
    <Link
      href={`/books/${book.id}`}
      className="group bg-white rounded-2xl border border-gray-100 hover:border-teal-200 hover:shadow-xl transition-all overflow-hidden flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        <img
          src={photo}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            if (img.src !== PLACEHOLDER_IMAGE) {
              img.src = PLACEHOLDER_IMAGE;
            }
          }}
        />

        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
              book.book_type === "new"
                ? "bg-teal-500 text-white"
                : "bg-amber-500 text-white"
            }`}
          >
            {book.book_type === "new" ? "Baru" : "Bekas"}
          </span>
        </div>

        {/* Condition Badge (for used) */}
        {book.condition_grade && (
          <div className="absolute top-3 right-3">
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getConditionColor(
                book.condition_grade
              )}`}
            >
              {getConditionLabel(book.condition_grade)}
            </span>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold">
              Habis
            </span>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="absolute bottom-3 right-3 w-9 h-9 bg-white/95 hover:bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category */}
        <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wider mb-1.5">
          {book.category?.name || "Tanpa Kategori"}
        </p>

        {/* Title */}
        <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2 group-hover:text-teal-600 transition leading-snug">
          {book.title}
        </h3>

        {/* Author */}
        <p className="text-xs text-gray-500 mb-3 line-clamp-1">oleh {book.author}</p>

        {/* Rating & Sold */}
        {(rating > 0 || totalSold > 0) && (
          <div className="flex items-center gap-2 mb-3 text-xs">
            {rating > 0 && (
              <div className="flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5 text-yellow-400 fill-current"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 13.187l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.566 7.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-semibold text-gray-700">
                  {rating.toFixed(1)}
                </span>
              </div>
            )}
            {rating > 0 && totalSold > 0 && (
              <span className="text-gray-300">•</span>
            )}
            {totalSold > 0 && (
              <span className="text-gray-500">{totalSold} terjual</span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="mt-auto">
          <p className="text-base font-bold text-gray-900">
            {formatPrice(book.price)}
          </p>

          {/* Year/Publisher Info */}
          {book.publisher && (
            <p className="text-xs text-gray-500 mt-2 truncate">
              {book.publisher}
              {book.year_published && ` • ${book.year_published}`}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

function BookCardList({ book }: { book: Book }) {
  const isOutOfStock = book.stock === 0;
  const photo = getPrimaryPhoto(book);
  const rating = book.rating ?? 0;
  const totalSold = book.total_sold ?? 0;
  const totalReviews = book.total_reviews ?? 0;

  return (
    <Link
      href={`/books/${book.id}`}
      className="group bg-white rounded-2xl border border-gray-100 hover:border-teal-200 hover:shadow-lg transition-all overflow-hidden flex"
    >
      {/* Image */}
      <div className="relative w-32 sm:w-40 aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 overflow-hidden">
        <img
          src={photo}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            if (img.src !== PLACEHOLDER_IMAGE) {
              img.src = PLACEHOLDER_IMAGE;
            }
          }}
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded text-xs font-bold">
              Habis
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col min-w-0">
        <div className="flex items-start gap-2 mb-2 flex-wrap">
          <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">
            {book.category?.name || "Tanpa Kategori"}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              book.book_type === "new"
                ? "bg-teal-100 text-teal-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {book.book_type === "new" ? "Baru" : "Bekas"}
          </span>
          {book.condition_grade && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getConditionColor(
                book.condition_grade
              )}`}
            >
              {getConditionLabel(book.condition_grade)}
            </span>
          )}
        </div>

        <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-1 line-clamp-2 group-hover:text-teal-600 transition">
          {book.title}
        </h3>

        <p className="text-sm text-gray-500 mb-2">oleh {book.author}</p>

        <p className="text-xs text-gray-600 line-clamp-2 mb-3 hidden sm:block">
          {book.description}
        </p>

        <div className="flex items-center gap-3 mb-3 text-xs flex-wrap">
          {rating > 0 && (
            <div className="flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5 text-yellow-400 fill-current"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 13.187l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.566 7.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-semibold text-gray-700">
                {rating.toFixed(1)}
              </span>
              {totalReviews > 0 && (
                <span className="text-gray-400">({totalReviews})</span>
              )}
            </div>
          )}
          {totalSold > 0 && (
            <>
              <span className="text-gray-300">•</span>
              <span className="text-gray-500">{totalSold} terjual</span>
            </>
          )}
          {book.publisher && (
            <>
              <span className="text-gray-300">•</span>
              <span className="text-gray-500">{book.publisher}</span>
            </>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2">
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            {formatPrice(book.price)}
          </p>
          <div className="text-xs text-gray-500 flex-shrink-0">
            Stok: {book.stock}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Skeleton component for loading states
export function BookCardSkeleton({ view = "grid" }: { view?: "grid" | "list" }) {
  if (view === "list") {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex animate-pulse">
        <div className="w-32 sm:w-40 aspect-[3/4] bg-gray-200 flex-shrink-0"></div>
        <div className="flex-1 p-4 sm:p-5">
          <div className="h-3 bg-gray-200 rounded w-20 mb-3"></div>
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="h-7 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-[3/4] bg-gray-200"></div>
      <div className="p-4">
        <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-5 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  );
}
