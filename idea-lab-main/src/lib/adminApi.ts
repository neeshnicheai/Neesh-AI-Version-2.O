const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8081';
const ADMIN_TOKEN_KEY = 'neesh_admin_token';

function getToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

async function adminFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `AdminToken ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem('neesh_admin_name');
    window.location.href = '/login';
    throw new Error('Admin session expired');
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) return {} as T;
  return response.json();
}

// --- Auth ---
export async function adminLogin(username: string, password: string) {
  const response = await fetch(`${BASE_URL}/api/public/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Login failed with status ${response.status}`);
  }

  return response.json() as Promise<{ token: string; displayName: string }>;
}

// --- Users ---
export async function getAdminUsers() {
  return adminFetch<AdminUser[]>('/api/public/admin/users');
}

// --- Roles ---
export async function getAdminRoles() {
  return adminFetch<AdminRoleDTO[]>('/api/public/admin/roles');
}

export async function createAdminRole(username: string, password: string, displayName: string) {
  return adminFetch<AdminRoleDTO>('/api/public/admin/roles', {
    method: 'POST',
    body: JSON.stringify({ username, password, displayName }),
  });
}

export async function deleteAdminRole(id: string) {
  return adminFetch<void>(`/api/public/admin/roles/${id}`, { method: 'DELETE' });
}

// --- Coupons ---
export async function getAdminCoupons() {
  return adminFetch<CouponDTO[]>('/api/public/admin/coupons');
}

export async function createAdminCoupon(data: CreateCouponRequest) {
  return adminFetch<CouponDTO>('/api/public/admin/coupons', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteAdminCoupon(id: string) {
  return adminFetch<void>(`/api/public/admin/coupons/${id}`, { method: 'DELETE' });
}

export async function validateCoupon(code: string) {
  return adminFetch<{ valid: boolean; discountPercentage: number; message: string }>('/api/public/admin/coupons/validate', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

// --- Types ---
export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  status: string;
  occupation: string | null;
  phone: string | null;
  location: string | null;
  profileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  projectCount: number;
  subscriptionPlan: string;
  promotedBlogCount: number;
  promotionTags: string[];
  couponUsed: string | null;
  paymentAmount: number | null;
  paymentDate: string | null;
  subscriptionExpiresAt: string | null;
}

export interface AdminRoleDTO {
  id: string;
  username: string;
  displayName: string;
  createdAt: string;
}

export interface CouponDTO {
  id: string;
  code: string;
  name: string;
  discountPercentage: number;
  expiryDate: string | null;
  maxUses: number;
  usedCount: number;
  active: boolean;
  valid: boolean;
  createdAt: string;
}

export interface CreateCouponRequest {
  code: string;
  name: string;
  discountPercentage: number;
  expiryDate: string | null;
  maxUses: number;
}
