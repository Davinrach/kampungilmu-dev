import api from "@/lib/api";

// ============== TYPES (Match Backend Response) ==============

export type BookType = "new" | "used";
export type BookCondition = "mulus" | "layak_baca" | "ada_coretan" | "rusak_ringan";
export type BookStatus = "active" | "inactive" | "out_of_stock";

export interface BookCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  icon?: string;
}

export interface BookPhoto {
  id: string;
  photo_url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface SellerInfo {
  id: string;
  store_name?: string;
  store_photo?: string;
  rating?: number;
  total_reviews?: number;
  city?: string;
  province?: string;
}

// Backend Book structure
export interface Book {
  id: string;
  seller_id: string;
  category_id: string;
  category: BookCategory;
  seller?: SellerInfo;
  title: string;
  author: string;
  publisher?: string;
  year_published?: number;
  isbn?: string | null;
  description: string;
  price: number;
  stock: number;
  book_type: BookType;
  condition_grade?: BookCondition | null;
  status: BookStatus;
  is_active: boolean;
  photos: BookPhoto[];
  rating?: number;
  total_reviews?: number;
  total_sold?: number;
  created_at: string;
  updated_at?: string;
}

export interface BookFilters {
  search?: string;
  category?: string;
  category_id?: string;
  book_type?: BookType;
  condition_grade?: BookCondition;
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  sort?: "newest" | "popular" | "cheapest" | "expensive" | "rating";
  page?: number;
  limit?: number;
  per_page?: number;
}

// Backend response format
export interface BackendListResponse<T> {
  success: boolean;
  message: string;
  data: T[] | {
    books?: T[];
    pagination?: {
      current_page: number;
      per_page: number;
      total_items: number;
      total_pages: number;
    };
    [key: string]: any;
  };
}

export interface BackendItemResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Frontend pagination format (normalized)
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ============== HELPERS ==============

// Normalize backend response to frontend pagination format
const normalizePaginatedResponse = <T>(
  response: BackendListResponse<T>
): PaginatedResponse<T> => {
  const responseData = response.data;
  
  // Extract array from known keys or fallback to the data itself if it is an array
  let items: T[] = [];
  let pagination: { current_page?: number; per_page?: number; total_items?: number; total_pages?: number } = {};

  if (Array.isArray(responseData)) {
    items = responseData;
  } else {
    const obj = responseData as { books?: T[]; pagination?: typeof pagination; [key: string]: any };
    if (obj.books && Array.isArray(obj.books)) {
      items = obj.books;
    } else {
      // Try to find any array property
      const arrayValues = Object.values(obj).filter(Array.isArray) as T[][];
      if (arrayValues.length > 0) items = arrayValues[0];
    }
    if (obj.pagination) {
      pagination = obj.pagination;
    }
  }

  return {
    data: items,
    total: pagination.total_items || items.length,
    page: pagination.current_page || 1,
    limit: pagination.per_page || 20,
    total_pages: pagination.total_pages || 1,
  };
};

const buildQueryParams = (filters: BookFilters): Record<string, any> => {
  const params: Record<string, any> = {};
  
  if (filters.search) {
    params.keyword = filters.search;
    params.search = filters.search;
    params.q = filters.search;
    params.title = filters.search;
  }
  
  if (filters.category) params.category = filters.category;
  if (filters.category_id) params.category_id = filters.category_id;
  if (filters.book_type) params.book_type = filters.book_type;
  if (filters.condition_grade) params.condition_grade = filters.condition_grade;
  if (filters.min_price !== undefined) params.min_price = filters.min_price;
  if (filters.max_price !== undefined) params.max_price = filters.max_price;
  if (filters.min_rating !== undefined) params.min_rating = filters.min_rating;
  if (filters.sort) params.sort = filters.sort;
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  if (filters.per_page) params.per_page = filters.per_page;
  return params;
};

// ============== SERVICE ==============

export const catalogService = {
  // Get all books with filters
  getBooks: async (filters: BookFilters = {}): Promise<PaginatedResponse<Book>> => {
    const params = buildQueryParams(filters);
    
    let paginated: PaginatedResponse<Book> = {
      data: [],
      total: 0,
      current_page: 1,
      total_pages: 1,
      per_page: 20
    };
    
    try {
      const response = await api.get<BackendListResponse<Book>>("/books", { params });
      paginated = normalizePaginatedResponse(response.data);
    } catch (error) {
      console.warn("Failed to fetch books from API, falling back to mock data");
    }
    
    // MOCK: If API is empty or failed, return dummy books so UI works locally
    if (paginated.data.length === 0) {
      const MOCK_BOOKS: Book[] = [
        {
          id: "book-1",
          seller_id: "seller-123",
          category_id: "cat-1",
          category: { id: "cat-1", name: "Fiksi", slug: "fiksi" },
          seller: { id: "seller-123", store_name: "Gramedia", is_verified: true, rating: 4.8 },
          title: "Bumi Manusia",
          author: "Pramoedya Ananta Toer",
          description: "Kisah Minke...",
          price: 85000,
          stock: 10,
          book_type: "new",
          condition_grade: null,
          status: "active",
          is_active: true,
          photos: [{ id: "p1", book_id: "book-1", photo_url: "https://d36u8i9q8hymue.cloudfront.net/uploads/images/202008/image_870x_5f2b84eb4375b.jpg", is_primary: true, sort_order: 1 }],
          rating: 4.9,
          total_reviews: 120,
          total_sold: 500,
          created_at: new Date().toISOString()
        },
        {
          id: "book-2",
          seller_id: "seller-123",
          category_id: "cat-2",
          category: { id: "cat-2", name: "Sains", slug: "sains" },
          seller: { id: "seller-123", store_name: "Gramedia", is_verified: true, rating: 4.8 },
          title: "Sapiens",
          author: "Yuval Noah Harari",
          description: "Sejarah umat manusia...",
          price: 120000,
          stock: 5,
          book_type: "used",
          condition_grade: "very_good",
          status: "active",
          is_active: true,
          photos: [{ id: "p2", book_id: "book-2", photo_url: "https://inc.mizanstore.com/aassets/img/com_cart/produk/sapiens-cove-mizan.jpg", is_primary: true, sort_order: 1 }],
          rating: 4.7,
          total_reviews: 80,
          total_sold: 300,
          created_at: new Date().toISOString()
        }
      ];
      
      // Filter mock books based on category if requested
      const filtered = filters.category 
        ? MOCK_BOOKS.filter(b => b.category.slug === filters.category)
        : MOCK_BOOKS;
        
      return {
        ...paginated,
        data: filtered,
        total: filtered.length,
      };
    }
    
    return paginated;
  },

  // Get single book by ID
  getBook: async (id: string): Promise<Book | null> => {
    try {
      const response = await api.get<BackendItemResponse<Book>>(`/books/${id}`);
      return response.data.data || null;
    } catch (err: any) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  },

  // Get categories
  getCategories: async (): Promise<BookCategory[]> => {
    const response = await api.get<BackendListResponse<BookCategory>>("/categories");
    const data = response.data.data;
    if (Array.isArray(data)) return data;
    return [];
  },

  // Get popular searches from backend
  getPopularSearches: async (): Promise<string[]> => {
    const response = await api.get<BackendItemResponse<any>>(
      "/books/popular-searches"
    );
    const data = response.data.data;
    if (!data) return [];
    if (Array.isArray(data)) {
      // Backend may return: array of strings, or array of objects {query: "..."}
      const seen = new Set<string>();
      return data
        .map((item: any) => {
          if (typeof item === "string") return item;
          return item?.query || item?.search || item?.keyword || item?.term || "";
        })
        .filter((s) => {
          if (!s || typeof s !== "string") return false;
          const lower = s.toLowerCase();
          if (seen.has(lower)) return false;
          seen.add(lower);
          return true;
        });
    }
    return [];
  },

  // Get auto-suggest
  // Backend may return array of strings (text suggestions) or array of Book objects
  getAutoSuggest: async (
    query: string
  ): Promise<{ suggestions: string[]; books: Book[] }> => {
    if (!query || query.length < 2) return { suggestions: [], books: [] };

    const response = await api.get<BackendListResponse<any>>("/books/suggest", {
      params: { q: query },
    });
    const data = response.data?.data ?? [];

    if (!Array.isArray(data)) return { suggestions: [], books: [] };

    const suggestions: string[] = [];
    const books: Book[] = [];

    for (const item of data) {
      if (typeof item === "string") {
        // Backend returned plain text recommendation
        suggestions.push(item);
      } else if (item && typeof item === "object") {
        // If item has 'title' & 'author' it's likely a Book
        if (item.title && (item.author || item.book_type !== undefined)) {
          books.push(item as Book);
        } else if (item.text || item.suggestion || item.query || item.keyword) {
          // Plain text wrapped in object
          suggestions.push(
            item.text || item.suggestion || item.query || item.keyword
          );
        } else if (item.title) {
          // Has title but missing other fields - treat as text suggestion
          suggestions.push(item.title);
        }
      }
    }

    return { suggestions, books };
  },

  // Get books in same category (used for "related books")
  // Note: Backend doesn't have a dedicated "/related" endpoint,
  // so we fetch books from the same category instead.
  getBooksByCategory: async (
    categoryId: string,
    excludeBookId?: string,
    limit = 4
  ): Promise<Book[]> => {
    const result = await catalogService.getBooks({
      category_id: categoryId,
      limit: limit + (excludeBookId ? 1 : 0),
    });
    let data = result.data;
    if (excludeBookId) {
      data = data.filter((b) => b.id !== excludeBookId);
    }
    return data.slice(0, limit);
  },

  // ===== SEARCH HISTORY (server-side, requires auth) =====

  /**
   * Get user's search history from backend (auth required).
   * Note: Backend records search queries automatically when user searches.
   */
  getSearchHistory: async (): Promise<string[]> => {
    try {
      const response = await api.get<BackendItemResponse<any>>(
        "/books/search-history"
      );
      const data = response.data.data;
      if (!data) return [];
      if (Array.isArray(data)) {
        const seen = new Set<string>();
        return data
          .map((item: any) => {
            if (typeof item === "string") return item;
            return item?.query || item?.search || item?.keyword || item?.term || "";
          })
          .filter((s) => {
            if (!s || typeof s !== "string") return false;
            const lower = s.toLowerCase();
            if (seen.has(lower)) return false;
            seen.add(lower);
            return true;
          });
      }
      return [];
    } catch (err: any) {
      // 401 = not logged in, no history available
      if (err?.response?.status === 401) return [];
      throw err;
    }
  },

  /**
   * Clear all user's search history (auth required).
   */
  clearSearchHistory: async (): Promise<void> => {
    try {
      await api.delete("/books/search-history");
    } catch (err: any) {
      if (err?.response?.status === 401) return;
      throw err;
    }
  },
};

// ============== UI HELPERS ==============

export const formatPrice = (price: number | string | null | undefined): string => {
  let value = 0;
  if (typeof price === "number" && !isNaN(price)) value = price;
  else if (typeof price === "string" && !isNaN(Number(price))) value = Number(price);
  return `Rp ${value.toLocaleString("id-ID")}`;
};

export const getConditionLabel = (condition?: BookCondition | null): string => {
  switch (condition) {
    case "mulus":
      return "Mulus";
    case "layak_baca":
      return "Layak Baca";
    case "ada_coretan":
      return "Ada Coretan";
    case "rusak_ringan":
      return "Rusak Ringan";
    default:
      return "-";
  }
};

export const getConditionColor = (condition?: BookCondition | null): string => {
  switch (condition) {
    case "mulus":
      return "bg-green-100 text-green-700";
    case "layak_baca":
      return "bg-blue-100 text-blue-700";
    case "ada_coretan":
      return "bg-yellow-100 text-yellow-700";
    case "rusak_ringan":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

// Inline SVG placeholder (no network request needed)
export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" preserveAspectRatio="none">
      <rect width="600" height="800" fill="#f3f4f6"/>
      <g transform="translate(300, 380)" fill="#9ca3af">
        <path transform="translate(-40, -50)" d="M48 12C32 12 18 18 18 18v60c0 0 14-6 30-6s30 6 30 6V18s-14-6-30-6zm0 6c10 0 22 3 24 4v50c-2-1-14-4-24-4s-22 3-24 4V22c2-1 14-4 24-4z"/>
      </g>
      <text x="300" y="500" font-family="Arial" font-size="24" fill="#9ca3af" text-anchor="middle">Tidak ada gambar</text>
    </svg>`
  );

// ============== SEARCH HISTORY (localStorage fallback for guest users) ==============
//
// Authenticated users: history is stored server-side via backend
//   - GET    /books/search-history  - List history
//   - DELETE /books/search-history  - Clear all
//   - Backend records search queries automatically when user calls /books?search=...
//
// Guest (non-authenticated) users: history stored in localStorage as fallback
//

const SEARCH_HISTORY_KEY = 'ki_search_history';
const MAX_HISTORY = 8;

export const searchHistory = {
  /**
   * Get history from localStorage (used as fallback for guest users).
   * For authenticated users, use catalogService.getSearchHistory() instead.
   */
  getAll: (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(SEARCH_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  /**
   * Add to local history (only used for guest users).
   * Authenticated users: backend records automatically when calling /books?search=
   */
  add: (query: string) => {
    if (typeof window === 'undefined' || !query.trim()) return;
    const trimmed = query.trim();
    let history = searchHistory.getAll();
    history = history.filter((h) => h.toLowerCase() !== trimmed.toLowerCase());
    history.unshift(trimmed);
    history = history.slice(0, MAX_HISTORY);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  },
  remove: (query: string) => {
    if (typeof window === 'undefined') return;
    const history = searchHistory
      .getAll()
      .filter((h) => h.toLowerCase() !== query.toLowerCase());
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  },
  clear: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  },
};

// Get primary photo URL or fallback
export const getPrimaryPhoto = (book: Book): string => {
  if (!book.photos || book.photos.length === 0) {
    return PLACEHOLDER_IMAGE;
  }
  const primary = book.photos.find((p) => p.is_primary);
  return primary?.photo_url || book.photos[0].photo_url;
};

// Get all photos URLs
export const getAllPhotoUrls = (book: Book): string[] => {
  if (!book.photos || book.photos.length === 0) {
    return [PLACEHOLDER_IMAGE];
  }
  return book.photos
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((p) => p.photo_url);
};

// Category icon map (since backend doesn't have icons)
const CATEGORY_ICONS: Record<string, string> = {
  novel: "📖",
  pelajaran: "🎓",
  fiksi: "📖",
  "non-fiksi": "📚",
  pendidikan: "🎓",
  anak: "🧸",
  komik: "💭",
  bisnis: "💼",
  sains: "🔬",
  sejarah: "🏛️",
  agama: "🕊️",
  hobi: "🎨",
  default: "📕",
};

export const getCategoryIcon = (category: BookCategory): string => {
  return category.icon || CATEGORY_ICONS[category.slug] || CATEGORY_ICONS.default;
};
