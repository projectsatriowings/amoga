/**
 * AMOGA E-COMMERCE — PRODUCTS & COLLECTIONS API SERVICE
 */

import { request } from './apiClient';

export async function fetchCollections() {
  const result = await request('/collections');
  return result.data || [];
}

export async function fetchProducts({ collection, category, q, sort, page, limit } = {}) {
  const params = new URLSearchParams();
  if (collection) params.set('collection', collection);
  if (category && category !== 'all') params.set('category', category);
  if (q && q.trim()) params.set('q', q.trim());
  if (sort) params.set('sort', sort);
  if (page) params.set('page', String(page));
  if (limit) params.set('limit', String(limit));

  const queryStr = params.toString();
  const endpoint = `/products${queryStr ? `?${queryStr}` : ''}`;
  const result = await request(endpoint);
  return result;
}

export async function fetchProductBySlug(collection, slug) {
  const endpoint = `/products/${encodeURIComponent(collection)}/${encodeURIComponent(slug)}`;
  const result = await request(endpoint);
  return result.data;
}
