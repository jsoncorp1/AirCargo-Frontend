import { apiClient } from './apiClient';

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface ArticleReceipt {
  id: string;
  articleId: string;
  articleSku: string;
  articleName: string;
  count: number;
  createdAt: string;
}

export interface ArticleReceiptsPaginatedResponse {
  page: number;
  perPage: number;
  totalPages: number;
  count: number;
  data: ArticleReceipt[];
}

export interface CreateArticleReceiptRequest {
  articleId: string;
  count: number;
}

export interface UpdateArticleReceiptRequest {
  count: number;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const articleReceiptService = {
  /**
   * Returns a paginated list of article receipts.
   * Optionally filter by articleId.
   */
  getReceipts: async (
    page = 1,
    perPage = 10,
    articleId?: string
  ): Promise<ArticleReceiptsPaginatedResponse> => {
    const query = new URLSearchParams({
      page: page.toString(),
      perPage: perPage.toString(),
    });
    if (articleId) query.append('articleId', articleId);
    return apiClient<ArticleReceiptsPaginatedResponse>(
      `/article-receipts?${query.toString()}`
    );
  },

  /** Returns a single receipt by its ID. */
  getReceiptById: async (id: string): Promise<ArticleReceipt> => {
    return apiClient<ArticleReceipt>(`/article-receipts/${id}`);
  },

  /** Creates a new receipt and increases the article's stock. */
  createReceipt: async (
    data: CreateArticleReceiptRequest
  ): Promise<ArticleReceipt> => {
    return apiClient<ArticleReceipt>('/article-receipts', {
      method: 'POST',
      data,
    });
  },

  /** Updates the quantity of an existing receipt. */
  updateReceipt: async (
    id: string,
    data: UpdateArticleReceiptRequest
  ): Promise<ArticleReceipt> => {
    return apiClient<ArticleReceipt>(`/article-receipts/${id}`, {
      method: 'PUT',
      data,
    });
  },

  /** Deletes a receipt (may decrease article stock depending on backend logic). */
  deleteReceipt: async (id: string): Promise<{ id: string }> => {
    return apiClient<{ id: string }>(`/article-receipts/${id}`, {
      method: 'DELETE',
    });
  },
};
