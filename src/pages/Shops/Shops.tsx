import { useEffect, useMemo, useState } from "react";
import {
  Edit3,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Store,
  Trash2,
  X,
  CheckCircle2,
  XCircle,
  Save,
} from "lucide-react";

import {
  createShop,
  deleteShopApi,
  fetchShops,
  updateShopApi,
} from "../../services/api";

interface Shop {
  id: number;
  name: string;
  location: string;
  phone?: string;
  status?: string;
  is_open?: boolean;
  created_at?: string;
}

function Shops() {
  const [shops, setShops] = useState<Shop[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [editingShop, setEditingShop] =
    useState<Shop | null>(null);

  const [shopName, setShopName] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");

  async function loadShops() {
    try {
      setLoading(true);
      setError("");

      const data = await fetchShops();

      setShops(data);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load shops.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadShops();
  }, []);

  const openShops = useMemo(() => {
    return shops.filter((shop) => {
      if (typeof shop.is_open === "boolean") {
        return shop.is_open;
      }

      return shop.status?.toLowerCase() === "open";
    }).length;
  }, [shops]);

  const closedShops = shops.length - openShops;

  function resetForm() {
    setShopName("");
    setLocation("");
    setPhone("");
  }

  function closeAddModal() {
    if (saving) {
      return;
    }

    setShowAddModal(false);
    resetForm();
  }

  function openEditModal(shop: Shop) {
    setError("");
    setSuccess("");

    setEditingShop(shop);
    setShopName(shop.name);
    setLocation(shop.location);
    setPhone(shop.phone || "");

    setShowEditModal(true);
  }

  function closeEditModal() {
    if (saving) {
      return;
    }

    setShowEditModal(false);
    setEditingShop(null);
    resetForm();
  }

  async function handleAddShop(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedName = shopName.trim();
    const trimmedLocation = location.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setError("Please enter a shop name.");
      return;
    }

    if (!trimmedLocation) {
      setError("Please enter the shop location.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await createShop({
        name: trimmedName,
        location: trimmedLocation,
        phone: trimmedPhone,
        status: "Open",
        is_open: true,
      });

      setSuccess(
        `${trimmedName} was created successfully.`,
      );

      setShowAddModal(false);
      resetForm();

      await loadShops();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create shop.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleEditShop(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editingShop) {
      return;
    }

    const trimmedName = shopName.trim();
    const trimmedLocation = location.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setError("Please enter a shop name.");
      return;
    }

    if (!trimmedLocation) {
      setError("Please enter the shop location.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await updateShopApi(editingShop.id, {
        name: trimmedName,
        location: trimmedLocation,
        phone: trimmedPhone,
      });

      setSuccess(
        `${trimmedName} was updated successfully.`,
      );

      setShowEditModal(false);
      setEditingShop(null);
      resetForm();

      await loadShops();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update shop.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleShop(shop: Shop) {
    const currentlyOpen =
      typeof shop.is_open === "boolean"
        ? shop.is_open
        : shop.status?.toLowerCase() === "open";

    try {
      setError("");
      setSuccess("");

      await updateShopApi(shop.id, {
        is_open: !currentlyOpen,
        status: !currentlyOpen ? "Open" : "Closed",
      });

      setSuccess(
        `${shop.name} is now ${
          !currentlyOpen ? "open" : "closed"
        }.`,
      );

      await loadShops();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update shop.",
      );
    }
  }

  async function handleDeleteShop(shop: Shop) {
    const confirmed = window.confirm(
      `Delete "${shop.name}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await deleteShopApi(shop.id);

      setSuccess(
        `${shop.name} was deleted successfully.`,
      );

      await loadShops();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete shop.",
      );
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Shops</h1>

          <p>
            Manage all SnackFlow shops from one place.
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
            onClick={loadShops}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={loading ? "spin" : ""}
            />

            Refresh
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setError("");
              setSuccess("");
              resetForm();
              setShowAddModal(true);
            }}
          >
            <Plus size={18} />

            Add Shop
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <XCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      <div className="dashboard-stats">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <Store size={21} />
          </div>

          <div>
            <span>Total Shops</span>
            <strong>{shops.length}</strong>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <CheckCircle2 size={21} />
          </div>

          <div>
            <span>Open Shops</span>
            <strong>{openShops}</strong>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <XCircle size={21} />
          </div>

          <div>
            <span>Closed Shops</span>
            <strong>{closedShops}</strong>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="dashboard-panel">
          <div className="empty-state">
            Loading shops...
          </div>
        </div>
      ) : shops.length === 0 ? (
        <div className="dashboard-panel">
          <div className="empty-state">
            <Store size={40} />

            <h3>No shops yet</h3>

            <p>
              Create your first shop to start
              managing SnackFlow.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setError("");
                setSuccess("");
                resetForm();
                setShowAddModal(true);
              }}
            >
              <Plus size={18} />
              Add First Shop
            </button>
          </div>
        </div>
      ) : (
        <div className="shop-grid">
          {shops.map((shop) => {
            const isOpen =
              typeof shop.is_open === "boolean"
                ? shop.is_open
                : shop.status?.toLowerCase() === "open";

            return (
              <div
                className="dashboard-panel"
                key={shop.id}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "15px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "center",
                    }}
                  >
                    <div className="dashboard-stat-icon">
                      <Store size={21} />
                    </div>

                    <div>
                      <h3 style={{ margin: 0 }}>
                        {shop.name}
                      </h3>

                      <span
                        style={{
                          fontSize: "13px",
                          opacity: 0.65,
                        }}
                      >
                        Shop #{shop.id}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`status-badge ${
                      isOpen ? "open" : "closed"
                    }`}
                  >
                    {isOpen ? "Open" : "Closed"}
                  </span>
                </div>

                <div
                  style={{
                    marginTop: "22px",
                    display: "grid",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    <MapPin size={17} />
                    <span>
                      {shop.location || "No location"}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    <Phone size={17} />
                    <span>
                      {shop.phone || "No phone number"}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "22px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      openEditModal(shop)
                    }
                  >
                    <Edit3 size={17} />
                    Edit
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      handleToggleShop(shop)
                    }
                  >
                    {isOpen
                      ? "Close Shop"
                      : "Open Shop"}
                  </button>

                  <button
                    type="button"
                    className="danger-button"
                    onClick={() =>
                      handleDeleteShop(shop)
                    }
                  >
                    <Trash2 size={17} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD SHOP MODAL */}
      {showAddModal && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeAddModal();
            }
          }}
        >
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h2>Add Shop</h2>

                <p>
                  Create a new SnackFlow shop.
                </p>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={closeAddModal}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleAddShop}
              className="form-grid"
            >
              <div className="form-field">
                <label htmlFor="shop-name">
                  Shop Name
                </label>

                <input
                  id="shop-name"
                  type="text"
                  placeholder="Example: Kukatpally Shop"
                  value={shopName}
                  onChange={(event) =>
                    setShopName(event.target.value)
                  }
                  disabled={saving}
                />
              </div>

              <div className="form-field">
                <label htmlFor="shop-location">
                  Location
                </label>

                <input
                  id="shop-location"
                  type="text"
                  placeholder="Example: Kukatpally"
                  value={location}
                  onChange={(event) =>
                    setLocation(event.target.value)
                  }
                  disabled={saving}
                />
              </div>

              <div className="form-field">
                <label htmlFor="shop-phone">
                  Phone
                </label>

                <input
                  id="shop-phone"
                  type="tel"
                  placeholder="Optional"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  disabled={saving}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "8px",
                }}
              >
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeAddModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  <Plus size={18} />

                  {saving
                    ? "Creating..."
                    : "Create Shop"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SHOP MODAL */}
      {showEditModal && editingShop && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeEditModal();
            }
          }}
        >
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h2>Edit Shop</h2>

                <p>
                  Update the details of{" "}
                  <strong>
                    {editingShop.name}
                  </strong>
                  .
                </p>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={closeEditModal}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleEditShop}
              className="form-grid"
            >
              <div className="form-field">
                <label htmlFor="edit-shop-name">
                  Shop Name
                </label>

                <input
                  id="edit-shop-name"
                  type="text"
                  value={shopName}
                  onChange={(event) =>
                    setShopName(event.target.value)
                  }
                  disabled={saving}
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label htmlFor="edit-shop-location">
                  Location
                </label>

                <input
                  id="edit-shop-location"
                  type="text"
                  value={location}
                  onChange={(event) =>
                    setLocation(event.target.value)
                  }
                  disabled={saving}
                />
              </div>

              <div className="form-field">
                <label htmlFor="edit-shop-phone">
                  Phone
                </label>

                <input
                  id="edit-shop-phone"
                  type="tel"
                  placeholder="Optional"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  disabled={saving}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "8px",
                }}
              >
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeEditModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  <Save size={18} />

                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Shops;