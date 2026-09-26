const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";


async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    localStorage.getItem(
      "snackflow_token",
    );

  const headers = new Headers(
    options.headers,
  );

  headers.set(
    "Content-Type",
    "application/json",
  );

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`,
    );
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    },
  );

  if (!response.ok) {
    let message =
      `API request failed: ${response.status}`;

    try {
      const errorData =
        await response.json();

      if (errorData?.detail) {
        message =
          typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(
                errorData.detail,
              );
      }
    } catch {}

    if (response.status === 401) {
      localStorage.removeItem(
        "snackflow_logged_in",
      );

      localStorage.removeItem(
        "snackflow_token",
      );

      localStorage.removeItem(
        "snackflow_user",
      );
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}


/* AUTHENTICATION */

export interface LoginRequest {
  username: string;
  password: string;
}


export interface LoginResponse {
  success: boolean;
  access_token: string;
  token_type: string;
  username: string;
  role: string;
  shop_id: number | null;
  message: string;
}


export interface CurrentUser {
  id: number;
  username: string;
  role: string;
  shop_id: number | null;
  is_active: boolean;
}


export async function loginApi(
  credentials: LoginRequest,
) {
  return request<LoginResponse>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(
        credentials,
      ),
    },
  );
}


export async function fetchCurrentUser() {
  return request<CurrentUser>(
    "/auth/me",
  );
}


/* USERS */

export interface ApiUser {
  id: number;
  username: string;
  role: string;
  shop_id: number | null;
  shop_name: string | null;
  is_active: boolean;
}


export interface CreateUserRequest {
  username: string;
  password: string;
  role: string;
  shop_id: number | null;
}


export interface UpdateUserRequest {
  username?: string;
  password?: string;
  role?: string;
  shop_id?: number;
  is_active?: boolean;
}


export async function fetchUsers() {
  return request<ApiUser[]>(
    "/users",
  );
}


export async function fetchUser(
  userId: number,
) {
  return request<ApiUser>(
    `/users/${userId}`,
  );
}


export async function createUserApi(
  user: CreateUserRequest,
) {
  return request<ApiUser>(
    "/users",
    {
      method: "POST",
      body: JSON.stringify(user),
    },
  );
}


export async function updateUserApi(
  userId: number,
  data: UpdateUserRequest,
) {
  return request<ApiUser>(
    `/users/${userId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
}


export async function deleteUserApi(
  userId: number,
) {
  return request<void>(
    `/users/${userId}`,
    {
      method: "DELETE",
    },
  );
}


/* SHOPS */

export interface ApiShop {
  id: number;
  name: string;
  location: string;
  phone?: string;
  status?: string;
  is_open?: boolean;
  created_at?: string;
}


export async function fetchShops() {
  return request<ApiShop[]>(
    "/shops",
  );
}


export async function fetchShop(
  shopId: number,
) {
  return request<ApiShop>(
    `/shops/${shopId}`,
  );
}


export async function createShop(
  shop: Omit<ApiShop, "id">,
) {
  return request<ApiShop>(
    "/shops",
    {
      method: "POST",
      body: JSON.stringify(shop),
    },
  );
}


export async function updateShopApi(
  shopId: number,
  data: Partial<ApiShop>,
) {
  return request<ApiShop>(
    `/shops/${shopId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
}


export async function deleteShopApi(
  shopId: number,
) {
  return request<void>(
    `/shops/${shopId}`,
    {
      method: "DELETE",
    },
  );
}


/* PRODUCTS */

export interface ApiProduct {
  id: number;
  name: string;
  price: number;
  category: string;
  shop_id: number;
  image?: string;
  is_active: boolean;
}


export async function fetchProducts() {
  return request<ApiProduct[]>(
    "/products",
  );
}


export async function fetchProduct(
  productId: number,
) {
  return request<ApiProduct>(
    `/products/${productId}`,
  );
}


export async function createProduct(
  product: Omit<ApiProduct, "id">,
) {
  return request<ApiProduct>(
    "/products",
    {
      method: "POST",
      body: JSON.stringify(
        product,
      ),
    },
  );
}


export async function updateProductApi(
  productId: number,
  data: Partial<ApiProduct>,
) {
  return request<ApiProduct>(
    `/products/${productId}`,
    {
      method: "PUT",
      body: JSON.stringify(
        data,
      ),
    },
  );
}


export async function deleteProductApi(
  productId: number,
) {
  return request<void>(
    `/products/${productId}`,
    {
      method: "DELETE",
    },
  );
}


/* ORDERS */

export interface ApiOrderItem {
  id?: number;
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
}


export interface ApiOrder {
  id: number;
  shop_id: number;
  total: number;
  payment_method: string;
  created_at: string;
  items: ApiOrderItem[];
}


export interface CreateOrderItem {
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
}


export interface CreateOrderRequest {
  shop_id: number;
  total: number;
  payment_method: string;
  items: CreateOrderItem[];
}


export async function fetchOrders() {
  return request<ApiOrder[]>(
    "/orders",
  );
}


export async function fetchOrder(
  orderId: number,
) {
  return request<ApiOrder>(
    `/orders/${orderId}`,
  );
}


export async function createOrder(
  order: CreateOrderRequest,
) {
  return request<ApiOrder>(
    "/orders",
    {
      method: "POST",
      body: JSON.stringify(order),
    },
  );
}


export async function deleteOrderApi(
  orderId: number,
) {
  return request<void>(
    `/orders/${orderId}`,
    {
      method: "DELETE",
    },
  );
}


/* WORKERS */

export interface ApiWorker {
  id: number;
  name: string;
  shop_id: number;
  shop_name?: string;
  salary: number;
  salary_paid: boolean;
  created_at?: string;
}


export interface CreateWorkerRequest {
  name: string;
  shop_id: number;
  salary: number;
  salary_paid: boolean;
}


export interface UpdateWorkerRequest {
  name?: string;
  shop_id?: number;
  salary?: number;
  salary_paid?: boolean;
}


export async function fetchWorkers() {
  return request<ApiWorker[]>(
    "/workers",
  );
}


export async function fetchWorker(
  workerId: number,
) {
  return request<ApiWorker>(
    `/workers/${workerId}`,
  );
}


export async function createWorker(
  worker: CreateWorkerRequest,
) {
  return request<ApiWorker>(
    "/workers",
    {
      method: "POST",
      body: JSON.stringify(
        worker,
      ),
    },
  );
}


export async function updateWorkerApi(
  workerId: number,
  data: UpdateWorkerRequest,
) {
  return request<ApiWorker>(
    `/workers/${workerId}`,
    {
      method: "PUT",
      body: JSON.stringify(
        data,
      ),
    },
  );
}


export async function deleteWorkerApi(
  workerId: number,
) {
  return request<void>(
    `/workers/${workerId}`,
    {
      method: "DELETE",
    },
  );
}


/* SALARY PAYMENTS */

export interface ApiSalaryPayment {
  id: number;
  worker_id: number;
  worker_name: string;
  amount: number;
  payment_month: string;
  payment_date: string;
  payment_method: string;
  notes?: string | null;
}


export interface CreateSalaryPaymentRequest {
  worker_id: number;
  amount: number;
  payment_month: string;
  payment_method: string;
  notes?: string;
}


export async function fetchSalaryPayments() {
  return request<ApiSalaryPayment[]>(
    "/salary-payments",
  );
}


export async function fetchWorkerSalaryPayments(
  workerId: number,
) {
  return request<ApiSalaryPayment[]>(
    `/salary-payments/worker/${workerId}`,
  );
}


export async function createSalaryPayment(
  payment: CreateSalaryPaymentRequest,
) {
  return request<ApiSalaryPayment>(
    "/salary-payments",
    {
      method: "POST",
      body: JSON.stringify(
        payment,
      ),
    },
  );
}


export async function deleteSalaryPayment(
  paymentId: number,
) {
  return request<void>(
    `/salary-payments/${paymentId}`,
    {
      method: "DELETE",
    },
  );
}


/* HEALTH */

export async function checkHealth() {
  return request<{
    status: string;
  }>("/health");
}


export async function fetchApiRoot() {
  return request<unknown>("/");
}