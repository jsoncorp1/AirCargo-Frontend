import { apiClient } from './apiClient';

export interface Article {
  id: string;
  sku: string;
  name: string;
  count: number;
  price: number;
  supplierId: string;
  fechaRegistro?: string;
}

export interface ArticlesPaginatedResponse {
  page: number;
  perPage: number;
  totalPages: number;
  count: number;
  data: Article[];
}

export interface CreateArticleRequest {
  sku: string;
  name: string;
  count: number;
  price: number;
  supplierId: string;
}

export interface UpdateArticleRequest {
  sku?: string;
  name?: string;
  count?: number;
  price?: number;
  supplierId?: string;
}

export const articleService = {
  getArticles: async (page = 1, perPage = 10, supplierId?: string): Promise<ArticlesPaginatedResponse> => {
    const query = new URLSearchParams({ page: page.toString(), perPage: perPage.toString() });
    if (supplierId) query.append('supplierId', supplierId);
    return apiClient<ArticlesPaginatedResponse>(`/articles?${query.toString()}`);
  },
  getArticleById: async (id: string): Promise<Article> => {
    return apiClient<Article>(`/articles/${id}`);
  },
  createArticle: async (data: CreateArticleRequest): Promise<Article> => {
    return apiClient<Article>('/articles', {
      method: 'POST',
      data,
    });
  },
  updateArticle: async (id: string, data: UpdateArticleRequest): Promise<Article> => {
    return apiClient<Article>(`/articles/${id}`, {
      method: 'PUT',
      data,
    });
  },
  deleteArticle: async (id: string): Promise<{ id: string }> => {
    return apiClient<{ id: string }>(`/articles/${id}`, {
      method: 'DELETE',
    });
  },
};
