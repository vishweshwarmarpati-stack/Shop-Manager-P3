import { useEffect, useMemo, useState } from "react";
import {
  Edit3,
  Image as ImageIcon,
  Package,
  Plus,
  RefreshCw,
  Power,
  Search,
  Store,
  Trash2,
  X,
} from "lucide-react";

import {
  createProduct,
  deleteProductApi,
  fetchProducts,
  fetchShops,
  updateProductApi,
} from "../../services/api";

interface Shop {
  id: number;
  name: string;
  location: string;
  phone?: string;
  status?: string;
  is_open?: boolean;
}

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  shop_id: number;
  image?: string;
  is_active: boolean;
}

interface ProductForm {
  name: string;
  price: string;
  category: string;
  image: string;
}

const categories = [
  "Idly",
  "Dosa",
  "Vada",
  "Puri",
  "Non-Veg Tiffins",
  "Tea & Coffee",
  "Evening Snacks",
  "Cool Drinks",
];

const categoryImages: Record<string, string> = {
  Idly: "/menu/idly.jpg",
  Dosa: "/menu/dosa.jpg",
  Vada: "/menu/vada.jpg",
  Puri: "/menu/puri.jpg",
  "Non-Veg Tiffins": "/menu/nonveg.jpg",
  "Tea & Coffee": "/menu/tea.jpg",
  "Evening Snacks": "/menu/evening-snacks.jpg",
};

const emptyForm: ProductForm = {
  name: "",
  price: "",
  category: "Idly",
  image: "",
};

function Products() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [selectedShopId, setSelectedShopId] =
    useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [form, setForm] =
    useState<ProductForm>(emptyForm);

  async function loadProductsPage() {
    try {
      setLoading(true);
      setError("");

      const [shopData, productData] =
        await Promise.all([
          fetchShops(),
          fetchProducts(),
        ]);

      setShops(shopData);
      setProducts(productData);

      if (
        selectedShopId === null &&
        shopData.length > 0
      ) {
        setSelectedShopId(shopData[0].id);
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load products.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProductsPage();
  }, []);

  const selectedShop = useMemo(() => {
    return shops.find(
      (shop) => shop.id === selectedShopId,
    );
  }, [shops, selectedShopId]);

  const shopProducts = useMemo(() => {
    if (selectedShopId === null) {
      return [];
    }

    return products.filter(
      (product) =>
        product.shop_id === selectedShopId,
    );
  }, [products, selectedShopId]);

  const filteredProducts = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    return shopProducts.filter((product) => {
      const matchesSearch =
        !searchText ||
        product.name
          .toLowerCase()
          .includes(searchText);

      const matchesCategory =
        selectedCategory === "All" ||
        product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [
    shopProducts,
    search,
    selectedCategory,
  ]);

  const availableCategories =
    useMemo(() => {
      const existingCategories =
        Array.from(
          new Set(
            shopProducts.map(
              (product) => product.category,
            ),
          ),
        );

      return [
        "All",
        ...categories.filter((category) =>
          existingCategories.includes(category),
        ),
      ];
    }, [shopProducts]);

  const totalProducts = shopProducts.length;

  const activeProducts = shopProducts.filter(
    (product) => product.is_active,
  ).length;

  const inactiveProducts =
    shopProducts.filter(
      (product) => !product.is_active,
    ).length;

  const categoryCount = new Set(
    shopProducts.map(
      (product) => product.category,
    ),
  ).size;

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  }

  function getProductImage(product: Product) {
    if (product.image) {
      return product.image;
    }

    return (
      categoryImages[product.category] ||
      "/menu/evening-snacks.jpg"
    );
  }

  function handleShopChange(shopId: number) {
    setSelectedShopId(shopId);
    setSearch("");
    setSelectedCategory("All");
    setError("");
    setSuccess("");
  }

  function openAddModal() {
    if (!selectedShopId) {
      setError(
        "Please create or select a shop first.",
      );
      return;
    }

    setEditingProduct(null);

    setForm({
      ...emptyForm,
      category: categories[0],
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);

    setForm({
      name: product.name,
      price: String(product.price),
      category: product.category,
      image: product.image || "",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingProduct(null);
    setForm(emptyForm);
  }

  function updateForm(
    field: keyof ProductForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedShopId) {
      setError("Please select a shop.");
      return;
    }

    const name = form.name.trim();
    const price = Number(form.price);

    if (!name) {
      setError("Product name is required.");
      return;
    }

    if (
      !form.price ||
      Number.isNaN(price) ||
      price <= 0
    ) {
      setError("Please enter a valid price.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingProduct) {
        const updated = await updateProductApi(
          editingProduct.id,
          {
            name,
            price,
            category: form.category,
            shop_id: selectedShopId,
            image:
              form.image.trim() || undefined,
            is_active:
              editingProduct.is_active,
          },
        );

        setProducts((current) =>
          current.map((product) =>
            product.id === editingProduct.id
              ? updated
              : product,
          ),
        );

        setSuccess(
          `${name} updated successfully.`,
        );
      } else {
        const created = await createProduct({
          name,
          price,
          category: form.category,
          shop_id: selectedShopId,
          image:
            form.image.trim() || undefined,
          is_active: true,
        });

        setProducts((current) => [
          ...current,
          created,
        ]);

        setSuccess(
          `${name} added to ${
            selectedShop?.name || "the shop"
          }.`,
        );
      }

      setShowModal(false);
      setEditingProduct(null);
      setForm(emptyForm);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save product.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(
    product: Product,
  ) {
    const nextStatus = !product.is_active;

    const confirmed = window.confirm(
      nextStatus
        ? `Activate "${product.name}" again? It will become available in POS.`
        : `Deactivate "${product.name}"? It will be hidden from POS but kept in historical orders.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const updated =
        await updateProductApi(
          product.id,
          {
            is_active: nextStatus,
          },
        );

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? updated
            : item,
        ),
      );

      setSuccess(
        `${product.name} ${
          nextStatus
            ? "activated"
            : "deactivated"
        } successfully.`,
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${
              nextStatus
                ? "activate"
                : "deactivate"
            } product.`,
      );
    }
  }

  async function handleDelete(
    product: Product,
  ) {
    const confirmed = window.confirm(
      `Permanently delete "${product.name}" from ${
        selectedShop?.name || "this shop"
      }?\n\nThis only works if the product has never been used in an order.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await deleteProductApi(product.id);

      setProducts((current) =>
        current.filter(
          (item) => item.id !== product.id,
        ),
      );

      setSuccess(
        `${product.name} deleted permanently.`,
      );
    } catch (err) {
      console.error(err);

      const message =
        err instanceof Error
          ? err.message
          : "Failed to delete product.";

      setError(message);
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <h1 style={{ margin: 0 }}>
              Products
            </h1>

            {selectedShop && (
              <span className="status-badge open">
                {selectedShop.name}
              </span>
            )}
          </div>

          <p>
            Manage the menu for each SnackFlow
            shop.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="secondary-button"
            onClick={loadProductsPage}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={
                loading ? "spin" : ""
              }
            />
            Refresh
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={openAddModal}
            disabled={shops.length === 0}
          >
            <Plus size={17} />
            Add Product
          </button>
        </div>
      </div>

      {error && (
        <div
          className="alert alert-error"
          style={{ marginBottom: "15px" }}
        >
          <Package size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          className="alert alert-success"
          style={{ marginBottom: "15px" }}
        >
          <Package size={18} />
          <span>{success}</span>
        </div>
      )}

      {!loading && shops.length === 0 && (
        <div
          className="dashboard-panel"
          style={{ marginBottom: "20px" }}
        >
          <div className="empty-state">
            <Store size={42} />

            <h3>No shops available</h3>

            <p>
              Create a shop first before adding
              products.
            </p>
          </div>
        </div>
      )}

      {shops.length > 0 && (
        <div
          className="dashboard-panel"
          style={{ marginBottom: "20px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  display: "grid",
                  placeItems: "center",
                  background:
                    "var(--primary-color)",
                  color: "white",
                }}
              >
                <Store size={21} />
              </div>

              <div>
                <strong
                  style={{
                    display: "block",
                    fontSize: "16px",
                  }}
                >
                  Managing Menu
                </strong>

                <span
                  style={{
                    fontSize: "13px",
                    opacity: 0.65,
                  }}
                >
                  Products shown below belong
                  only to the selected shop.
                </span>
              </div>
            </div>

            <div
              className="form-field"
              style={{
                margin: 0,
                minWidth: "280px",
              }}
            >
              <label htmlFor="product-shop">
                Select Shop
              </label>

              <select
                id="product-shop"
                value={selectedShopId ?? ""}
                onChange={(event) =>
                  handleShopChange(
                    Number(event.target.value),
                  )
                }
              >
                {shops.map((shop) => (
                  <option
                    key={shop.id}
                    value={shop.id}
                  >
                    {shop.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {selectedShop && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "15px",
            marginBottom: "20px",
          }}
        >
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon">
              <Package size={20} />
            </div>

            <div>
              <span>Products</span>
              <strong>{totalProducts}</strong>
            </div>
          </div>

          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon">
              <Power size={20} />
            </div>

            <div>
              <span>Active</span>
              <strong>{activeProducts}</strong>
            </div>
          </div>

          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon">
              <Power size={20} />
            </div>

            <div>
              <span>Inactive</span>
              <strong>{inactiveProducts}</strong>
            </div>
          </div>

          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon">
              <Store size={20} />
            </div>

            <div>
              <span>Categories</span>
              <strong>{categoryCount}</strong>
            </div>
          </div>
        </div>
      )}

      {selectedShop && (
        <div
          className="dashboard-panel"
          style={{ marginBottom: "20px" }}
        >
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: "220px",
                position: "relative",
              }}
            >
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: "13px",
                  top: "50%",
                  transform:
                    "translateY(-50%)",
                  opacity: 0.5,
                }}
              />

              <input
                type="text"
                placeholder="Search this shop's menu..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                style={{
                  width: "100%",
                  height: "45px",
                  paddingLeft: "42px",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "0 12px",
                height: "45px",
                border:
                  "1px solid var(--border-color)",
                borderRadius: "10px",
                fontSize: "13px",
                opacity: 0.7,
                whiteSpace: "nowrap",
              }}
            >
              <Package size={16} />
              {filteredProducts.length} shown
            </div>
          </div>

          {availableCategories.length > 1 && (
            <div
              style={{
                display: "flex",
                gap: "8px",
                overflowX: "auto",
                paddingTop: "14px",
              }}
            >
              {availableCategories.map(
                (category) => {
                  const active =
                    selectedCategory ===
                    category;

                  return (
                    <button
                      key={category}
                      type="button"
                      className={
                        active
                          ? "primary-button"
                          : "secondary-button"
                      }
                      onClick={() =>
                        setSelectedCategory(
                          category,
                        )
                      }
                      style={{
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      {category}
                    </button>
                  );
                },
              )}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="dashboard-panel">
          <div className="empty-state">
            <RefreshCw
              size={38}
              className="spin"
            />

            <h3>Loading menu...</h3>

            <p>
              Fetching products from the
              database.
            </p>
          </div>
        </div>
      ) : selectedShop &&
        shopProducts.length === 0 ? (
        <div className="dashboard-panel">
          <div className="empty-state">
            <Package size={42} />

            <h3>
              This shop has no products yet
            </h3>

            <p>
              Add the first product to{" "}
              <strong>
                {selectedShop.name}
              </strong>
              .
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={openAddModal}
              style={{ marginTop: "10px" }}
            >
              <Plus size={17} />
              Add First Product
            </button>
          </div>
        </div>
      ) : selectedShop &&
        filteredProducts.length === 0 ? (
        <div className="dashboard-panel">
          <div className="empty-state">
            <Search size={42} />

            <h3>No matching products</h3>

            <p>
              Try a different search term or
              category.
            </p>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(210px, 1fr))",
            gap: "18px",
          }}
        >
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="dashboard-panel"
              style={{
                margin: 0,
                padding: 0,
                overflow: "hidden",
                opacity: product.is_active
                  ? 1
                  : 0.68,
              }}
            >
              <div
                style={{
                  position: "relative",
                  height: "150px",
                  background:
                    "var(--surface-color)",
                }}
              >
                <img
                  src={getProductImage(product)}
                  alt={product.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    filter: product.is_active
                      ? "none"
                      : "grayscale(70%)",
                  }}
                />

                <span
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    padding: "5px 9px",
                    borderRadius: "999px",
                    background:
                      "rgba(0,0,0,0.65)",
                    color: "white",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {product.category}
                </span>

                <span
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    padding: "5px 9px",
                    borderRadius: "999px",
                    background: product.is_active
                      ? "rgba(22, 163, 74, 0.9)"
                      : "rgba(220, 38, 38, 0.9)",
                    color: "white",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {product.is_active
                    ? "ACTIVE"
                    : "INACTIVE"}
                </span>
              </div>

              <div style={{ padding: "14px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "flex-start",
                    gap: "10px",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "15px",
                      }}
                    >
                      {product.name}
                    </h3>

                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "18px",
                        fontWeight: 800,
                      }}
                    >
                      {formatCurrency(
                        Number(product.price),
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "5px",
                      flexWrap: "wrap",
                      justifyContent:
                        "flex-end",
                    }}
                  >
                    <button
                      type="button"
                      className="icon-button"
                      title="Edit product"
                      onClick={() =>
                        openEditModal(product)
                      }
                    >
                      <Edit3 size={15} />
                    </button>

                    <button
                      type="button"
                      className="icon-button"
                      title={
                        product.is_active
                          ? "Deactivate product"
                          : "Activate product"
                      }
                      onClick={() =>
                        handleToggleStatus(
                          product,
                        )
                      }
                    >
                      <Power size={15} />
                    </button>

                    <button
                      type="button"
                      className="icon-button"
                      title="Permanently delete product"
                      onClick={() =>
                        handleDelete(product)
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "12px",
                    paddingTop: "10px",
                    borderTop:
                      "1px solid var(--border-color)",
                    fontSize: "11px",
                    opacity: 0.5,
                  }}
                >
                  {selectedShop?.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div
            className="modal-card"
            style={{
              width: "min(520px, 94vw)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                gap: "15px",
                marginBottom: "20px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: "0 0 5px",
                  }}
                >
                  {editingProduct
                    ? "Edit Product"
                    : "Add Product"}
                </h2>

                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    opacity: 0.65,
                  }}
                >
                  {selectedShop
                    ? `Menu for ${selectedShop.name}`
                    : "Select a shop"}
                </p>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="product-name">
                  Product Name
                </label>

                <input
                  id="product-name"
                  type="text"
                  placeholder="e.g. Masala Dosa"
                  value={form.name}
                  onChange={(event) =>
                    updateForm(
                      "name",
                      event.target.value,
                    )
                  }
                  disabled={saving}
                  autoFocus
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div className="form-field">
                  <label htmlFor="product-price">
                    Price
                  </label>

                  <input
                    id="product-price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={form.price}
                    onChange={(event) =>
                      updateForm(
                        "price",
                        event.target.value,
                      )
                    }
                    disabled={saving}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="product-category">
                    Category
                  </label>

                  <select
                    id="product-category"
                    value={form.category}
                    onChange={(event) =>
                      updateForm(
                        "category",
                        event.target.value,
                      )
                    }
                    disabled={saving}
                  >
                    {categories.map(
                      (category) => (
                        <option
                          key={category}
                          value={category}
                        >
                          {category}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="product-image">
                  Image Path
                </label>

                <div
                  style={{
                    position: "relative",
                  }}
                >
                  <ImageIcon
                    size={17}
                    style={{
                      position:
                        "absolute",
                      left: "12px",
                      top: "50%",
                      transform:
                        "translateY(-50%)",
                      opacity: 0.5,
                    }}
                  />

                  <input
                    id="product-image"
                    type="text"
                    placeholder="/menu/products/idly.jpg"
                    value={form.image}
                    onChange={(event) =>
                      updateForm(
                        "image",
                        event.target.value,
                      )
                    }
                    disabled={saving}
                    style={{
                      paddingLeft: "40px",
                    }}
                  />
                </div>

                <small
                  style={{
                    display: "block",
                    marginTop: "5px",
                    fontSize: "11px",
                    opacity: 0.55,
                  }}
                >
                  Optional. Use a path such
                  as /menu/products/idly.jpg.
                  Leave empty to use the
                  category image.
                </small>
              </div>

              <div
                style={{
                  marginTop: "20px",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background:
                    "var(--surface-color)",
                  border:
                    "1px solid var(--border-color)",
                  fontSize: "13px",
                }}
              >
                <strong>Shop:</strong>{" "}
                {selectedShop?.name ||
                  "Not selected"}
              </div>

              {editingProduct && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background:
                      editingProduct.is_active
                        ? "rgba(22, 163, 74, 0.08)"
                        : "rgba(220, 38, 38, 0.08)",
                    border:
                      "1px solid var(--border-color)",
                    fontSize: "13px",
                  }}
                >
                  Product status:{" "}
                  <strong>
                    {editingProduct.is_active
                      ? "Active"
                      : "Inactive"}
                  </strong>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "flex-end",
                  gap: "10px",
                  marginTop: "22px",
                }}
              >
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      {editingProduct ? (
                        <Edit3 size={16} />
                      ) : (
                        <Plus size={16} />
                      )}

                      {editingProduct
                        ? "Save Changes"
                        : "Add Product"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;