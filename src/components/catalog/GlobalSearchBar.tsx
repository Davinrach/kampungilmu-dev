"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  catalogService,
  Book,
  searchHistory as localHistory,
  formatPrice,
  getPrimaryPhoto,
  PLACEHOLDER_IMAGE,
} from "@/services/catalogService";
import { useAuthStore } from "@/store/authStore";

export default function GlobalSearchBar() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [textSuggestions, setTextSuggestions] = useState<string[]>([]);
  const [bookSuggestions, setBookSuggestions] = useState<Book[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load history (server for auth, localStorage for guest)
  const loadHistory = async () => {
    if (isAuthenticated) {
      try {
        const serverHistory = await catalogService.getSearchHistory();
        setHistory(serverHistory);
      } catch {
        setHistory([]);
      }
    } else {
      setHistory(localHistory.getAll());
    }
  };

  // Load popular searches & history on mount + when auth changes
  useEffect(() => {
    if (!hasHydrated) return;

    catalogService
      .getPopularSearches()
      .then(setPopularSearches)
      .catch(() => setPopularSearches([]));

    loadHistory();
  }, [hasHydrated, isAuthenticated]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced auto-suggest
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setTextSuggestions([]);
      setBookSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await catalogService.getAutoSuggest(query);
        setTextSuggestions(result.suggestions.slice(0, 5));
        setBookSuggestions(result.books.slice(0, 5));
      } catch {
        setTextSuggestions([]);
        setBookSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const performSearch = (q: string) => {
    if (!q.trim()) return;

    // For guests, save to localStorage
    // For auth users, backend records automatically when /books?search= is hit
    if (!isAuthenticated) {
      localHistory.add(q);
      setHistory(localHistory.getAll());
    }

    setIsOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(`/books?search=${encodeURIComponent(q)}`);

    // Refresh history after search (for auth users, may pick up the new entry)
    if (isAuthenticated) {
      setTimeout(() => loadHistory(), 500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const handleRemoveHistory = (e: React.MouseEvent, item: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      localHistory.remove(item);
      setHistory(localHistory.getAll());
    }
    // Note: Backend doesn't support deleting individual history items,
    // only "clear all" via DELETE /books/search-history
  };

  const handleClearHistory = async () => {
    if (isAuthenticated) {
      try {
        await catalogService.clearSearchHistory();
        setHistory([]);
      } catch {
        // ignore
      }
    } else {
      localHistory.clear();
      setHistory([]);
    }
  };

  const showDropdown =
    isOpen &&
    (query.trim().length >= 2 ||
      history.length > 0 ||
      popularSearches.length > 0);

  // Highlight matching part of query in suggestion text
  const highlightMatch = (text: string, q: string): React.ReactNode => {
    if (!q || !text) return text;
    const lower = text.toLowerCase();
    const idx = lower.indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.substring(0, idx)}
        <strong className="font-semibold text-teal-600">
          {text.substring(idx, idx + q.length)}
        </strong>
        {text.substring(idx + q.length)}
      </>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder="Cari buku, penulis, atau ISBN..."
            className="w-full pl-11 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition-all text-sm text-gray-900 placeholder-gray-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-400"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
          {/* Auto-Suggest Results */}
          {query.trim().length >= 2 && (
            <div>
              {loading && (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  <div className="inline-block animate-spin w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full"></div>
                  <span className="ml-2">Mencari...</span>
                </div>
              )}

              {/* Text Suggestions (rekomendasi teks dari backend) */}
              {!loading && textSuggestions.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1.5">
                    <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Rekomendasi Pencarian
                    </h3>
                  </div>
                  <div>
                    {textSuggestions.map((text, idx) => (
                      <button
                        key={`text-sug-${idx}`}
                        onClick={() => performSearch(text)}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition text-left"
                      >
                        <svg
                          className="w-4 h-4 text-gray-400 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        <span className="flex-1 text-sm text-gray-700 truncate">
                          {highlightMatch(text, query)}
                        </span>
                        <svg
                          className="w-3 h-3 text-gray-300 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                          />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Book Suggestions (preview buku) */}
              {!loading && bookSuggestions.length > 0 && (
                <div
                  className={
                    textSuggestions.length > 0
                      ? "border-t border-gray-100"
                      : ""
                  }
                >
                  <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
                    <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Saran Buku
                    </h3>
                    <button
                      onClick={() => performSearch(query)}
                      className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
                    >
                      Lihat semua →
                    </button>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {bookSuggestions.map((book, idx) => (
                      <Link
                        key={book.id || `suggestion-${idx}`}
                        href={`/books/${book.id}`}
                        onClick={() => {
                          setIsOpen(false);
                          setQuery("");
                        }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                      >
                        <div className="w-12 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={getPrimaryPhoto(book)}
                            alt={book.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              if (img.src !== PLACEHOLDER_IMAGE) {
                                img.src = PLACEHOLDER_IMAGE;
                              }
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm line-clamp-1">
                            {book.title}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-1">
                            oleh {book.author}
                          </p>
                          <p className="text-sm font-bold text-teal-600 mt-1">
                            {formatPrice(book.price)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty result */}
              {!loading &&
                textSuggestions.length === 0 &&
                bookSuggestions.length === 0 &&
                query.trim().length >= 2 && (
                  <div className="px-4 py-6 text-center text-sm text-gray-500">
                    <p>Tidak ada saran untuk &quot;{query}&quot;</p>
                    <button
                      onClick={() => performSearch(query)}
                      className="mt-2 text-xs text-teal-600 hover:text-teal-700 font-semibold"
                    >
                      Cari &quot;{query}&quot; di semua buku →
                    </button>
                  </div>
                )}
            </div>
          )}

          {/* History */}
          {query.trim().length < 2 && history.length > 0 && (
            <div className="border-b border-gray-100 last:border-b-0">
              <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Riwayat Pencarian
                </h3>
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-red-500 hover:text-red-600 font-medium"
                >
                  Hapus semua
                </button>
              </div>
              <div className="pb-2">
                {history.map((item, idx) => (
                  <button
                    key={`${item}-${idx}`}
                    onClick={() => performSearch(item)}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition group text-left"
                  >
                    <svg
                      className="w-4 h-4 text-gray-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="flex-1 text-sm text-gray-700 truncate">
                      {item}
                    </span>
                    {/* Per-item delete only for guest users (backend doesn't support) */}
                    {!isAuthenticated && (
                      <span
                        onClick={(e) => handleRemoveHistory(e, item)}
                        className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-400 transition"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular Searches */}
          {query.trim().length < 2 && popularSearches.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1.5">
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <svg
                    className="w-3.5 h-3.5 text-orange-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A3 3 0 0112.12 15.12z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Pencarian Populer
                </h3>
              </div>
              <div className="px-4 pb-3 flex flex-wrap gap-2">
                {popularSearches.slice(0, 8).map((item, idx) => (
                  <button
                    key={`popular-${idx}-${item}`}
                    onClick={() => performSearch(item)}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-teal-50 hover:text-teal-700 rounded-full text-xs font-medium text-gray-600 transition"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {query.trim().length < 2 &&
            history.length === 0 &&
            popularSearches.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                <svg
                  className="w-10 h-10 text-gray-300 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Mulai cari buku favorit Anda
              </div>
            )}
        </div>
      )}
    </div>
  );
}
