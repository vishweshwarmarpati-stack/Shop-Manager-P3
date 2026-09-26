export type Shop = {
  id: number;
  name: string;
  location?: string;
  phone?: string;
  status?: string;
  is_open?: boolean;
  created_at?: string;
};

export type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  shop_id: number;
  image?: string;
};

export type OrderItem = {
  id?: number;
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
};

export type Order = {
  id: number;
  shop_id: number;
  shop_name?: string;
  total: number;
  payment_method: string;
  created_at: string;
  items: OrderItem[];
};

export type Worker = {
  id: number;
  name: string;
  shop_id: number;
  shop_name?: string;
  salary: number;
  salary_paid: boolean;
};

const STORAGE_KEYS = {
  shops: "snackflow_shops",
  products: "snackflow_products",
  orders: "snackflow_orders",
  workers: "snackflow_workers",
};

export const SNACKFLOW_DATA_UPDATED =
  "snackflow_data_updated";

// ============================================================
// DEFAULT SHOP
// ============================================================

export const defaultShop: Shop = {
  id: 1,
  name: "Main Shop",
  location: "Main Location",
  phone: "",
  status: "Open",
  is_open: true,
};

// ============================================================
// GENERIC STORAGE HELPERS
// ============================================================

function readStorage<T>(
  key: string,
  fallback: T,
): T {
  try {
    const raw =
      localStorage.getItem(key);

    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(
  key: string,
  value: T,
) {
  localStorage.setItem(
    key,
    JSON.stringify(value),
  );

  notifyDataUpdate();
}

// ============================================================
// UPDATE EVENT
// ============================================================

export function notifyDataUpdate() {
  window.dispatchEvent(
    new Event(
      SNACKFLOW_DATA_UPDATED,
    ),
  );
}

export function subscribeToDataUpdates(
  callback: () => void,
): () => void {
  const handleUpdate = () => {
    callback();
  };

  window.addEventListener(
    SNACKFLOW_DATA_UPDATED,
    handleUpdate,
  );

  window.addEventListener(
    "storage",
    handleUpdate,
  );

  return () => {
    window.removeEventListener(
      SNACKFLOW_DATA_UPDATED,
      handleUpdate,
    );

    window.removeEventListener(
      "storage",
      handleUpdate,
    );
  };
}

// ============================================================
// SHOPS
// ============================================================

export function getShops(): Shop[] {
  const shops =
    readStorage<Shop[]>(
      STORAGE_KEYS.shops,
      [],
    );

  if (shops.length === 0) {
    return [defaultShop];
  }

  return shops;
}

export function saveShops(
  shops: Shop[],
) {
  writeStorage(
    STORAGE_KEYS.shops,
    shops,
  );
}

export function addShop(
  shop: Shop,
) {
  const shops =
    getShops();

  saveShops([
    ...shops,
    shop,
  ]);
}

export function getShopById(
  shopId: number,
) {
  return getShops().find(
    (shop) =>
      Number(shop.id) ===
      Number(shopId),
  );
}

export function updateShop(
  shopId: number,
  updates: Partial<Shop>,
) {
  const shops =
    getShops();

  const updatedShops =
    shops.map(
      (shop) =>
        Number(shop.id) ===
        Number(shopId)
          ? {
              ...shop,
              ...updates,
            }
          : shop,
    );

  saveShops(
    updatedShops,
  );
}

export function deleteShop(
  shopId: number,
) {
  const shops =
    getShops();

  const remainingShops =
    shops.filter(
      (shop) =>
        Number(shop.id) !==
        Number(shopId),
    );

  saveShops(
    remainingShops,
  );
}

export function isShopOpen(
  shop: Shop,
): boolean {
  if (
    typeof shop.is_open ===
    "boolean"
  ) {
    return shop.is_open;
  }

  const status =
    String(
      shop.status ?? "",
    ).toLowerCase();

  return (
    status === "open" ||
    status === "active" ||
    status === "opened"
  );
}

// ============================================================
// PRODUCTS
// ============================================================

export function getProducts(): Product[] {
  return readStorage<Product[]>(
    STORAGE_KEYS.products,
    [],
  );
}

export function saveProducts(
  products: Product[],
) {
  writeStorage(
    STORAGE_KEYS.products,
    products,
  );
}

export function getProductsByShop(
  shopId: number,
): Product[] {
  return getProducts().filter(
    (product) =>
      Number(
        product.shop_id,
      ) === Number(shopId),
  );
}

export function getProductById(
  productId: number,
) {
  return getProducts().find(
    (product) =>
      Number(product.id) ===
      Number(productId),
  );
}

// ============================================================
// ORDERS
// ============================================================

export function getOrders(): Order[] {
  return readStorage<Order[]>(
    STORAGE_KEYS.orders,
    [],
  );
}

export function saveOrders(
  orders: Order[],
) {
  writeStorage(
    STORAGE_KEYS.orders,
    orders,
  );
}

export function addOrder(
  order: Order,
) {
  const orders =
    getOrders();

  saveOrders([
    ...orders,
    order,
  ]);
}

export function deleteOrder(
  orderId: number,
) {
  const orders =
    getOrders();

  saveOrders(
    orders.filter(
      (order) =>
        Number(order.id) !==
        Number(orderId),
    ),
  );
}

export function getOrdersByShop(
  shopId: number,
): Order[] {
  return getOrders().filter(
    (order) =>
      Number(
        order.shop_id,
      ) === Number(shopId),
  );
}

// ============================================================
// WORKERS
// ============================================================

export function getWorkers(): Worker[] {
  return readStorage<Worker[]>(
    STORAGE_KEYS.workers,
    [],
  );
}

export function saveWorkers(
  workers: Worker[],
) {
  writeStorage(
    STORAGE_KEYS.workers,
    workers,
  );
}

export function addWorker(
  worker: Worker,
) {
  const workers =
    getWorkers();

  saveWorkers([
    ...workers,
    worker,
  ]);
}

export function deleteWorker(
  workerId: number,
) {
  const workers =
    getWorkers();

  saveWorkers(
    workers.filter(
      (worker) =>
        Number(worker.id) !==
        Number(workerId),
    ),
  );
}

export function updateWorker(
  workerId: number,
  updates: Partial<Worker>,
) {
  const workers =
    getWorkers();

  const updatedWorkers =
    workers.map(
      (worker) =>
        Number(worker.id) ===
        Number(workerId)
          ? {
              ...worker,
              ...updates,
            }
          : worker,
    );

  saveWorkers(
    updatedWorkers,
  );
}

// ============================================================
// ANALYTICS HELPERS
// ============================================================

export function getTotalSales(): number {
  return getOrders().reduce(
    (sum, order) =>
      sum +
      Number(
        order.total || 0,
      ),
    0,
  );
}

export function getTotalOrders(): number {
  return getOrders().length;
}

export function getItemsSold(): number {
  return getOrders().reduce(
    (sum, order) =>
      sum +
      order.items.reduce(
        (
          itemSum,
          item,
        ) =>
          itemSum +
          Number(
            item.quantity ||
              0,
          ),
        0,
      ),
    0,
  );
}

export function getPendingSalary(): number {
  return getWorkers()
    .filter(
      (worker) =>
        !worker.salary_paid,
    )
    .reduce(
      (sum, worker) =>
        sum +
        Number(
          worker.salary || 0,
        ),
      0,
    );
}

export function getAverageOrderValue(): number {
  const orders =
    getOrders();

  if (orders.length === 0) {
    return 0;
  }

  return (
    getTotalSales() /
    orders.length
  );
}

export function getShopSales(
  shopId: number,
): number {
  return getOrdersByShop(
    shopId,
  ).reduce(
    (sum, order) =>
      sum +
      Number(
        order.total || 0,
      ),
    0,
  );
}

// ============================================================
// CLEAR ALL DATA
// ============================================================

export function clearSnackFlowData() {
  Object.values(
    STORAGE_KEYS,
  ).forEach((key) => {
    localStorage.removeItem(
      key,
    );
  });

  notifyDataUpdate();
}