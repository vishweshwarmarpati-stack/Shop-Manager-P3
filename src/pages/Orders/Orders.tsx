import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Receipt,
  Trash2,
} from "lucide-react";

import {
  deleteOrderApi,
  fetchOrders,
  fetchShops,
  type ApiOrder,
  type ApiShop,
} from "../../services/api";

function Orders() {
  const [orders, setOrders] =
    useState<ApiOrder[]>([]);

  const [shops, setShops] =
    useState<ApiShop[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [expandedOrderId, setExpandedOrderId] =
    useState<number | null>(null);

  // ========================================================
  // LOAD DATA
  // ========================================================

  async function loadData() {
    try {
      setError("");
      setLoading(true);

      const [
        orderData,
        shopData,
      ] = await Promise.all([
        fetchOrders(),
        fetchShops(),
      ]);

      setOrders(orderData);
      setShops(shopData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load orders.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // ========================================================
  // HELPERS
  // ========================================================

  function getShopName(
    shopId: number,
  ) {
    return (
      shops.find(
        (shop) =>
          Number(shop.id) ===
          Number(shopId),
      )?.name ??
      `Shop #${shopId}`
    );
  }

  function formatCurrency(
    value: number,
  ) {
    return `₹${Number(value).toFixed(2)}`;
  }

  function formatDate(
    value: string,
  ) {
    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return value;
    }

    return date.toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      },
    );
  }

  // ========================================================
  // STATISTICS
  // ========================================================

  const totalSales =
    useMemo(
      () =>
        orders.reduce(
          (
            total,
            order,
          ) =>
            total +
            Number(
              order.total ||
                0,
            ),
          0,
        ),
      [orders],
    );

  const itemsSold =
    useMemo(
      () =>
        orders.reduce(
          (
            total,
            order,
          ) =>
            total +
            order.items.reduce(
              (
                itemTotal,
                item,
              ) =>
                itemTotal +
                Number(
                  item.quantity ||
                    0,
                ),
              0,
            ),
          0,
        ),
      [orders],
    );

  // ========================================================
  // DELETE ORDER
  // ========================================================

  async function handleDeleteOrder(
    order: ApiOrder,
  ) {
    const confirmed =
      window.confirm(
        `Delete Order #${order.id}? This action cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteOrderApi(
        order.id,
      );

      if (
        expandedOrderId ===
        order.id
      ) {
        setExpandedOrderId(
          null,
        );
      }

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete order.",
      );
    }
  }

  // ========================================================
  // TOGGLE DETAILS
  // ========================================================

  function toggleOrder(
    orderId: number,
  ) {
    setExpandedOrderId(
      (current) =>
        current ===
        orderId
          ? null
          : orderId,
    );
  }

  // ========================================================
  // UI
  // ========================================================

  return (
    <div className="page">
      {/* ================================================== */}
      {/* HEADER                                             */}
      {/* ================================================== */}

      <div className="page-header">
        <div>
          <h1>
            Orders
          </h1>

          <p>
            View and manage all
            orders across your
            shops.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={
            loadData
          }
          disabled={
            loading
          }
        >
          <RefreshCw
            size={17}
            className={
              loading
                ? "spin"
                : ""
            }
          />

          Refresh
        </button>
      </div>

      {/* ================================================== */}
      {/* ERROR                                              */}
      {/* ================================================== */}

      {error && (
        <div
          className="login-error"
          style={{
            marginBottom:
              "20px",
          }}
        >
          {error}
        </div>
      )}

      {/* ================================================== */}
      {/* STATISTICS                                         */}
      {/* ================================================== */}

      <div className="dashboard-grid">
        <div className="dashboard-stat-card">
          <div className="stat-icon">
            <Receipt
              size={21}
            />
          </div>

          <div>
            <span>
              Total Orders
            </span>

            <strong>
              {orders.length}
            </strong>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon">
            ₹
          </div>

          <div>
            <span>
              Total Sales
            </span>

            <strong>
              {formatCurrency(
                totalSales,
              )}
            </strong>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon">
            <Receipt
              size={21}
            />
          </div>

          <div>
            <span>
              Items Sold
            </span>

            <strong>
              {itemsSold}
            </strong>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* ORDERS TABLE                                       */}
      {/* ================================================== */}

      {loading ? (
        <div className="empty-state">
          <RefreshCw
            size={35}
            className="spin"
          />

          <h3>
            Loading orders...
          </h3>

          <p>
            Getting orders from
            the server.
          </p>
        </div>
      ) : orders.length ===
        0 ? (
        <div className="empty-state">
          <Receipt size={45} />

          <h3>
            No orders yet
          </h3>

          <p>
            Orders generated from
            POS will appear here.
          </p>
        </div>
      ) : (
        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>
                Order History
              </h2>

              <p>
                {orders.length}{" "}
                order
                {orders.length !==
                1
                  ? "s"
                  : ""}{" "}
                recorded.
              </p>
            </div>
          </div>

          <div
            style={{
              overflowX:
                "auto",
            }}
          >
            <table>
              <thead>
                <tr>
                  <th>
                    Order
                  </th>

                  <th>
                    Shop
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Items
                  </th>

                  <th>
                    Payment
                  </th>

                  <th>
                    Total
                  </th>

                  <th>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {orders.map(
                  (
                    order,
                  ) => {
                    const isExpanded =
                      expandedOrderId ===
                      order.id;

                    const itemCount =
                      order.items.reduce(
                        (
                          total,
                          item,
                        ) =>
                          total +
                          Number(
                            item.quantity ||
                              0,
                          ),
                        0,
                      );

                    return (
                      <>
                        <tr
                          key={
                            order.id
                          }
                        >
                          <td>
                            <strong>
                              #
                              {
                                order.id
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              getShopName(
                                order.shop_id,
                              )
                            }
                          </td>

                          <td>
                            {formatDate(
                              order.created_at,
                            )}
                          </td>

                          <td>
                            {
                              itemCount
                            }
                          </td>

                          <td>
                            <span className="status-badge status-open">
                              {
                                order.payment_method
                              }
                            </span>
                          </td>

                          <td>
                            <strong>
                              {formatCurrency(
                                Number(
                                  order.total,
                                ),
                              )}
                            </strong>
                          </td>

                          <td>
                            <div
                              style={{
                                display:
                                  "flex",
                                gap:
                                  "8px",
                              }}
                            >
                              <button
                                type="button"
                                className="icon-button"
                                title={
                                  isExpanded
                                    ? "Hide details"
                                    : "View details"
                                }
                                onClick={() =>
                                  toggleOrder(
                                    order.id,
                                  )
                                }
                              >
                                {isExpanded ? (
                                  <ChevronUp
                                    size={
                                      17
                                    }
                                  />
                                ) : (
                                  <ChevronDown
                                    size={
                                      17
                                    }
                                  />
                                )}
                              </button>

                              <button
                                type="button"
                                className="danger-button"
                                title="Delete order"
                                onClick={() =>
                                  handleDeleteOrder(
                                    order,
                                  )
                                }
                              >
                                <Trash2
                                  size={
                                    16
                                  }
                                />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* ================================= */}
                        {/* ORDER DETAILS                     */}
                        {/* ================================= */}

                        {isExpanded && (
                          <tr
                            key={`${order.id}-details`}
                          >
                            <td
                              colSpan={
                                7
                              }
                              style={{
                                background:
                                  "#f9fafb",
                              }}
                            >
                              <div
                                style={{
                                  padding:
                                    "10px 4px",
                                }}
                              >
                                <h3
                                  style={{
                                    margin:
                                      "0 0 14px",
                                  }}
                                >
                                  Order #
                                  {
                                    order.id
                                  }{" "}
                                  Details
                                </h3>

                                <div
                                  style={{
                                    overflowX:
                                      "auto",
                                  }}
                                >
                                  <table>
                                    <thead>
                                      <tr>
                                        <th>
                                          Product
                                        </th>

                                        <th>
                                          Price
                                        </th>

                                        <th>
                                          Quantity
                                        </th>

                                        <th>
                                          Subtotal
                                        </th>
                                      </tr>
                                    </thead>

                                    <tbody>
                                      {order.items.map(
                                        (
                                          item,
                                        ) => (
                                          <tr
                                            key={
                                              item.id ??
                                              `${order.id}-${item.product_id}`
                                            }
                                          >
                                            <td>
                                              {
                                                item.product_name
                                              }
                                            </td>

                                            <td>
                                              {formatCurrency(
                                                Number(
                                                  item.price,
                                                ),
                                              )}
                                            </td>

                                            <td>
                                              {
                                                item.quantity
                                              }
                                            </td>

                                            <td>
                                              <strong>
                                                {formatCurrency(
                                                  Number(
                                                    item.subtotal,
                                                  ),
                                                )}
                                              </strong>
                                            </td>
                                          </tr>
                                        ),
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;