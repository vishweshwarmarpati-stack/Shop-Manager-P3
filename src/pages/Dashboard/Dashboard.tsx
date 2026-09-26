import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BarChart3,
  CircleDollarSign,
  CreditCard,
  Package,
  RefreshCw,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";

import {
  fetchOrders,
  fetchProducts,
  fetchSalaryPayments,
  fetchShops,
  fetchWorkers,
  type ApiOrder,
  type ApiProduct,
  type ApiSalaryPayment,
  type ApiShop,
  type ApiWorker,
} from "../../services/api";


function getCurrentMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1,
  ).padStart(2, "0")}`;
}


function formatMonth(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return month;
  }

  const [
    year,
    monthNumber,
  ] = month.split("-");

  return new Date(
    Number(year),
    Number(monthNumber) - 1,
    1,
  ).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}


/*
 * SnackFlow shop-status helper.
 *
 * The backend may expose the shop state through either:
 *   is_open: true / false
 * or:
 *   status: "open" / "closed"
 *
 * We support both so Dashboard, Shop Performance,
 * and the shop counter cannot disagree.
 */
function isShopOpen(shop: ApiShop) {
  if (
    typeof shop.is_open ===
    "boolean"
  ) {
    return shop.is_open;
  }

  const normalizedStatus =
    String(
      shop.status ?? "",
    )
      .trim()
      .toLowerCase();

  return (
    normalizedStatus === "open" ||
    normalizedStatus === "active" ||
    normalizedStatus === "opened"
  );
}


function Dashboard() {
  const [
    orders,
    setOrders,
  ] = useState<ApiOrder[]>([]);

  const [
    products,
    setProducts,
  ] = useState<ApiProduct[]>([]);

  const [
    shops,
    setShops,
  ] = useState<ApiShop[]>([]);

  const [
    workers,
    setWorkers,
  ] = useState<ApiWorker[]>([]);

  const [
    salaryPayments,
    setSalaryPayments,
  ] = useState<ApiSalaryPayment[]>(
    [],
  );

  const [
    selectedMonth,
    setSelectedMonth,
  ] = useState(
    getCurrentMonth(),
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    lastUpdated,
    setLastUpdated,
  ] = useState<Date | null>(
    null,
  );


  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [
        ordersData,
        productsData,
        shopsData,
        workersData,
        salaryPaymentsData,
      ] = await Promise.all([
        fetchOrders(),
        fetchProducts(),
        fetchShops(),
        fetchWorkers(),
        fetchSalaryPayments(),
      ]);

      setOrders(ordersData);
      setProducts(productsData);
      setShops(shopsData);
      setWorkers(workersData);
      setSalaryPayments(
        salaryPaymentsData,
      );

      setLastUpdated(new Date());

    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load dashboard.",
      );

    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadDashboard();
  }, []);


  /* =========================================================
     HELPERS
     ========================================================= */

  function formatCurrency(
    amount: number,
  ) {
    return `₹${amount.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    )}`;
  }


  function getLocalDateKey(
    dateString: string,
  ) {
    const date =
      new Date(dateString);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return "";
    }

    return `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, "0")}-${String(
      date.getDate(),
    ).padStart(2, "0")}`;
  }


  function getTodayKey() {
    const now = new Date();

    return `${now.getFullYear()}-${String(
      now.getMonth() + 1,
    ).padStart(2, "0")}-${String(
      now.getDate(),
    ).padStart(2, "0")}`;
  }


  function getMonthKey(
    dateString: string,
  ) {
    const date =
      new Date(dateString);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return "";
    }

    return `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, "0")}`;
  }


  function getOrderTotal(
    order: ApiOrder,
  ) {
    return Number(order.total) || 0;
  }


  function getOrderItems(
    order: ApiOrder,
  ) {
    return order.items.reduce(
      (sum, item) =>
        sum +
        Number(
          item.quantity || 0,
        ),
      0,
    );
  }


  /* =========================================================
     TODAY
     ========================================================= */

  const todayKey =
    getTodayKey();

  const todayOrders =
    useMemo(() => {
      return orders.filter(
        (order) =>
          getLocalDateKey(
            order.created_at,
          ) === todayKey,
      );
    }, [orders, todayKey]);


  const todaySales =
    useMemo(() => {
      return todayOrders.reduce(
        (sum, order) =>
          sum +
          getOrderTotal(order),
        0,
      );
    }, [todayOrders]);


  const todayItemsSold =
    useMemo(() => {
      return todayOrders.reduce(
        (sum, order) =>
          sum +
          getOrderItems(order),
        0,
      );
    }, [todayOrders]);


  const todayAverageOrderValue =
    todayOrders.length > 0
      ? todaySales /
        todayOrders.length
      : 0;


  const todaySalaryExpense =
    useMemo(() => {
      return salaryPayments
        .filter(
          (payment) =>
            getLocalDateKey(
              payment.payment_date,
            ) === todayKey,
        )
        .reduce(
          (sum, payment) =>
            sum +
            Number(
              payment.amount || 0,
            ),
          0,
        );
    }, [
      salaryPayments,
      todayKey,
    ]);


  const todayNetRevenue =
    todaySales -
    todaySalaryExpense;


  /* =========================================================
     SELECTED MONTH
     ========================================================= */

  const monthOrders =
    useMemo(() => {
      return orders.filter(
        (order) =>
          getMonthKey(
            order.created_at,
          ) === selectedMonth,
      );
    }, [
      orders,
      selectedMonth,
    ]);


  const monthSales =
    useMemo(() => {
      return monthOrders.reduce(
        (sum, order) =>
          sum +
          getOrderTotal(order),
        0,
      );
    }, [monthOrders]);


  const monthItemsSold =
    useMemo(() => {
      return monthOrders.reduce(
        (sum, order) =>
          sum +
          getOrderItems(order),
        0,
      );
    }, [monthOrders]);


  const monthSalaryPaid =
    useMemo(() => {
      return salaryPayments
        .filter(
          (payment) =>
            payment.payment_month ===
            selectedMonth,
        )
        .reduce(
          (sum, payment) =>
            sum +
            Number(
              payment.amount || 0,
            ),
          0,
        );
    }, [
      salaryPayments,
      selectedMonth,
    ]);


  const monthSalaryDue =
    useMemo(() => {
      return workers.reduce(
        (sum, worker) =>
          sum +
          Number(
            worker.salary || 0,
          ),
        0,
      );
    }, [workers]);


  const monthSalaryRemaining =
    Math.max(
      monthSalaryDue -
        monthSalaryPaid,
      0,
    );


  const monthNetRevenue =
    monthSales -
    monthSalaryPaid;


  /* =========================================================
     WORKER PAYMENT STATUS
     ========================================================= */

  const workerPaymentStatus =
    useMemo(() => {
      return workers.map(
        (worker) => {
          const paid =
            salaryPayments
              .filter(
                (payment) =>
                  payment.worker_id ===
                    worker.id &&
                  payment.payment_month ===
                    selectedMonth,
              )
              .reduce(
                (
                  sum,
                  payment,
                ) =>
                  sum +
                  Number(
                    payment.amount ||
                      0,
                  ),
                0,
              );

          const salary =
            Number(
              worker.salary || 0,
            );

          let status:
            | "paid"
            | "partial"
            | "pending";

          if (
            paid >= salary
          ) {
            status = "paid";
          } else if (
            paid > 0
          ) {
            status = "partial";
          } else {
            status = "pending";
          }

          return {
            worker,
            salary,
            paid,
            remaining:
              Math.max(
                salary - paid,
                0,
              ),
            status,
          };
        },
      );
    }, [
      workers,
      salaryPayments,
      selectedMonth,
    ]);


  const fullyPaidWorkers =
    workerPaymentStatus.filter(
      (item) =>
        item.status === "paid",
    ).length;


  const partiallyPaidWorkers =
    workerPaymentStatus.filter(
      (item) =>
        item.status ===
        "partial",
    ).length;


  const pendingWorkers =
    workerPaymentStatus.filter(
      (item) =>
        item.status === "pending",
    ).length;


  /* =========================================================
     SHOPS
     ========================================================= */

  const openShops =
    shops.filter(
      (shop) =>
        isShopOpen(shop),
    ).length;


  const closedShops =
    shops.length -
    openShops;


  /* =========================================================
     SHOP PERFORMANCE
     ========================================================= */

  const shopPerformance =
    useMemo(() => {
      return shops
        .map((shop) => {
          const shopOrders =
            orders.filter(
              (order) =>
                order.shop_id ===
                shop.id,
            );

          const sales =
            shopOrders.reduce(
              (sum, order) =>
                sum +
                getOrderTotal(
                  order,
                ),
              0,
            );

          const items =
            shopOrders.reduce(
              (sum, order) =>
                sum +
                getOrderItems(
                  order,
                ),
              0,
            );

          return {
            id: shop.id,
            name: shop.name,
            sales,
            orders:
              shopOrders.length,
            items,
            isOpen:
              isShopOpen(shop),
          };
        })
        .sort(
          (a, b) =>
            b.sales - a.sales,
        );
    }, [
      shops,
      orders,
    ]);


  /* =========================================================
     TOP PRODUCTS
     ========================================================= */

  const topProducts =
    useMemo(() => {
      const productMap =
        new Map<
          number,
          {
            name: string;
            quantity: number;
            sales: number;
          }
        >();

      orders.forEach(
        (order) => {
          order.items.forEach(
            (item) => {
              const existing =
                productMap.get(
                  item.product_id,
                );

              if (existing) {
                existing.quantity +=
                  Number(
                    item.quantity,
                  );

                existing.sales +=
                  Number(
                    item.subtotal,
                  );
              } else {
                productMap.set(
                  item.product_id,
                  {
                    name:
                      item.product_name,
                    quantity:
                      Number(
                        item.quantity,
                      ),
                    sales:
                      Number(
                        item.subtotal,
                      ),
                  },
                );
              }
            },
          );
        },
      );

      return Array.from(
        productMap.values(),
      )
        .sort(
          (a, b) =>
            b.quantity -
            a.quantity,
        )
        .slice(0, 5);
    }, [orders]);


  /* =========================================================
     TODAY PAYMENT BREAKDOWN
     ========================================================= */

  const todayPaymentBreakdown =
    useMemo(() => {
      const map =
        new Map<
          string,
          number
        >();

      todayOrders.forEach(
        (order) => {
          const method =
            order.payment_method ||
            "Unknown";

          map.set(
            method,
            (map.get(method) ||
              0) +
              getOrderTotal(
                order,
              ),
          );
        },
      );

      return Array.from(
        map.entries(),
      )
        .map(
          ([
            method,
            amount,
          ]) => ({
            method,
            amount,
          }),
        )
        .sort(
          (a, b) =>
            b.amount -
            a.amount,
        );
    }, [todayOrders]);


  /* =========================================================
     RECENT ORDERS
     ========================================================= */

  const recentOrders =
    useMemo(() => {
      return [...orders]
        .sort(
          (a, b) =>
            new Date(
              b.created_at,
            ).getTime() -
            new Date(
              a.created_at,
            ).getTime(),
        )
        .slice(0, 6);
    }, [orders]);


  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="page-container">

      {/* HEADER */}

      <div className="page-header">

        <div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >

            <h1
              style={{
                margin: 0,
              }}
            >
              Dashboard
            </h1>

            <span className="status-badge open">
              LIVE
            </span>

          </div>

          <p>
            Your complete SnackFlow
            business overview.
          </p>

          {lastUpdated && (
            <div
              style={{
                fontSize: "12px",
                opacity: 0.6,
                marginTop: "5px",
              }}
            >
              Last updated{" "}
              {lastUpdated.toLocaleTimeString(
                "en-IN",
              )}
            </div>
          )}

        </div>


        <button
          type="button"
          className="secondary-button"
          onClick={
            loadDashboard
          }
          disabled={loading}
        >

          <RefreshCw
            size={17}
            className={
              loading
                ? "spin"
                : ""
            }
          />

          {loading
            ? "Refreshing..."
            : "Refresh"}

        </button>

      </div>


      {/* ERROR */}

      {error && (
        <div
          className="alert alert-error"
          style={{
            marginBottom: "20px",
          }}
        >
          <BarChart3 size={18} />
          <span>{error}</span>
        </div>
      )}


      {/* TODAY STAT CARDS */}

      <div className="dashboard-stats">

        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon">
            <CircleDollarSign
              size={20}
            />
          </div>

          <div>

            <span>
              Today Sales
            </span>

            <strong>
              {formatCurrency(
                todaySales,
              )}
            </strong>

            <small>
              {todayOrders.length}{" "}
              orders
            </small>

          </div>

        </div>


        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon">
            <ShoppingBag
              size={20}
            />
          </div>

          <div>

            <span>
              Today Orders
            </span>

            <strong>
              {todayOrders.length}
            </strong>

            <small>
              {todayItemsSold} items
              sold
            </small>

          </div>

        </div>


        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon">
            <BarChart3
              size={20}
            />
          </div>

          <div>

            <span>
              Avg Order
            </span>

            <strong>
              {formatCurrency(
                todayAverageOrderValue,
              )}
            </strong>

            <small>
              Today's average
            </small>

          </div>

        </div>


        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon">
            <WalletCards
              size={20}
            />
          </div>

          <div>

            <span>
              Salary Paid Today
            </span>

            <strong>
              {formatCurrency(
                todaySalaryExpense,
              )}
            </strong>

            <small>
              Recorded payments
            </small>

          </div>

        </div>


        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon">
            <TrendingUp
              size={20}
            />
          </div>

          <div>

            <span>
              Today's Net
            </span>

            <strong>
              {formatCurrency(
                todayNetRevenue,
              )}
            </strong>

            <small>
              Sales − salary paid
            </small>

          </div>

        </div>


        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon">
            <Store
              size={20}
            />
          </div>

          <div>

            <span>
              Shops
            </span>

            <strong>
              {shops.length}
            </strong>

            <small>
              {openShops} open ·{" "}
              {closedShops} closed
            </small>

          </div>

        </div>

      </div>


      {/* MONTH SELECTOR */}

      <div
        className="dashboard-panel"
        style={{
          marginTop: "20px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >

        <div>

          <h2
            style={{
              margin: 0,
            }}
          >
            Monthly Business Summary
          </h2>

          <p
            style={{
              margin:
                "5px 0 0",
              opacity: 0.65,
            }}
          >
            Financial overview for the
            selected month.
          </p>

        </div>


        <div
          className="form-field"
          style={{
            minWidth: "210px",
            margin: 0,
          }}
        >

          <label>
            Month
          </label>

          <input
            type="month"
            value={
              selectedMonth
            }
            onChange={(event) =>
              setSelectedMonth(
                event.target
                  .value,
              )
            }
          />

        </div>

      </div>


      {/* MONTHLY BUSINESS SUMMARY */}

      <div className="dashboard-stats">

        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon">
            <CircleDollarSign
              size={20}
            />
          </div>

          <div>

            <span>
              {formatMonth(
                selectedMonth,
              )}{" "}
              Sales
            </span>

            <strong>
              {formatCurrency(
                monthSales,
              )}
            </strong>

            <small>
              {monthOrders.length}{" "}
              orders
            </small>

          </div>

        </div>


        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon">
            <ShoppingBag
              size={20}
            />
          </div>

          <div>

            <span>
              Items Sold
            </span>

            <strong>
              {monthItemsSold}
            </strong>

            <small>
              Selected month
            </small>

          </div>

        </div>


        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon">
            <WalletCards
              size={20}
            />
          </div>

          <div>

            <span>
              Salary Paid
            </span>

            <strong>
              {formatCurrency(
                monthSalaryPaid,
              )}
            </strong>

            <small>
              Selected month
            </small>

          </div>

        </div>


        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon">
            <TrendingUp
              size={20}
            />
          </div>

          <div>

            <span>
              Net Revenue
            </span>

            <strong>
              {formatCurrency(
                monthNetRevenue,
              )}
            </strong>

            <small>
              Sales − salary paid
            </small>

          </div>

        </div>


        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon">
            <WalletCards
              size={20}
            />
          </div>

          <div>

            <span>
              Salary Remaining
            </span>

            <strong>
              {formatCurrency(
                monthSalaryRemaining,
              )}
            </strong>

            <small>
              Of{" "}
              {formatCurrency(
                monthSalaryDue,
              )}{" "}
              expected
            </small>

          </div>

        </div>

      </div>


      {/* WORKFORCE SUMMARY */}

      <div
        className="dashboard-panel"
        style={{
          marginTop: "20px",
        }}
      >

        <div className="dashboard-panel-header">

          <div>

            <h2>
              Workforce
            </h2>

            <p>
              Salary status for{" "}
              {formatMonth(
                selectedMonth,
              )}
              .
            </p>

          </div>

          <Users size={21} />

        </div>


        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "15px",
          }}
        >

          <div
            style={{
              padding: "18px",
              borderRadius: "12px",
              background:
                "rgba(34, 197, 94, 0.08)",
              border:
                "1px solid rgba(34, 197, 94, 0.16)",
            }}
          >

            <span
              style={{
                display: "block",
                fontSize: "13px",
                opacity: 0.65,
              }}
            >
              Fully Paid
            </span>

            <strong
              style={{
                display: "block",
                fontSize: "25px",
                marginTop: "5px",
              }}
            >
              {fullyPaidWorkers}
            </strong>

          </div>


          <div
            style={{
              padding: "18px",
              borderRadius: "12px",
              background:
                "rgba(245, 158, 11, 0.08)",
              border:
                "1px solid rgba(245, 158, 11, 0.16)",
            }}
          >

            <span
              style={{
                display: "block",
                fontSize: "13px",
                opacity: 0.65,
              }}
            >
              Partially Paid
            </span>

            <strong
              style={{
                display: "block",
                fontSize: "25px",
                marginTop: "5px",
              }}
            >
              {partiallyPaidWorkers}
            </strong>

          </div>


          <div
            style={{
              padding: "18px",
              borderRadius: "12px",
              background:
                "rgba(239, 68, 68, 0.08)",
              border:
                "1px solid rgba(239, 68, 68, 0.16)",
            }}
          >

            <span
              style={{
                display: "block",
                fontSize: "13px",
                opacity: 0.65,
              }}
            >
              Pending
            </span>

            <strong
              style={{
                display: "block",
                fontSize: "25px",
                marginTop: "5px",
              }}
            >
              {pendingWorkers}
            </strong>

          </div>


          <div
            style={{
              padding: "18px",
              borderRadius: "12px",
              background:
                "rgba(59, 130, 246, 0.08)",
              border:
                "1px solid rgba(59, 130, 246, 0.16)",
            }}
          >

            <span
              style={{
                display: "block",
                fontSize: "13px",
                opacity: 0.65,
              }}
            >
              Total Workers
            </span>

            <strong
              style={{
                display: "block",
                fontSize: "25px",
                marginTop: "5px",
              }}
            >
              {workers.length}
            </strong>

          </div>

        </div>

      </div>


      {/* BUSINESS SUMMARY */}

      <div
        className="dashboard-panel"
        style={{
          marginTop: "20px",
        }}
      >

        <div className="dashboard-panel-header">

          <div>

            <h2>
              Business Summary
            </h2>

            <p>
              Overall SnackFlow
              performance.
            </p>

          </div>

          <BarChart3 size={21} />

        </div>


        <div className="dashboard-stats">

          <div className="dashboard-stat-card">

            <div className="dashboard-stat-icon">
              <CircleDollarSign
                size={20}
              />
            </div>

            <div>

              <span>
                All-Time Sales
              </span>

              <strong>
                {formatCurrency(
                  orders.reduce(
                    (
                      sum,
                      order,
                    ) =>
                      sum +
                      getOrderTotal(
                        order,
                      ),
                    0,
                  ),
                )}
              </strong>

            </div>

          </div>


          <div className="dashboard-stat-card">

            <div className="dashboard-stat-icon">
              <ShoppingBag
                size={20}
              />
            </div>

            <div>

              <span>
                All-Time Orders
              </span>

              <strong>
                {orders.length}
              </strong>

            </div>

          </div>


          <div className="dashboard-stat-card">

            <div className="dashboard-stat-icon">
              <Package size={20} />
            </div>

            <div>

              <span>
                Items Sold
              </span>

              <strong>
                {orders.reduce(
                  (
                    sum,
                    order,
                  ) =>
                    sum +
                    getOrderItems(
                      order,
                    ),
                  0,
                )}
              </strong>

            </div>

          </div>


          <div className="dashboard-stat-card">

            <div className="dashboard-stat-icon">
              <WalletCards
                size={20}
              />
            </div>

            <div>

              <span>
                Selected Month
              </span>

              <strong>
                {formatCurrency(
                  monthNetRevenue,
                )}
              </strong>

              <small>
                Net revenue
              </small>

            </div>

          </div>

        </div>

      </div>


      {/* SHOP PERFORMANCE */}

      <div
        className="dashboard-panel"
        style={{
          marginTop: "20px",
        }}
      >

        <div className="dashboard-panel-header">

          <div>

            <h2>
              Shop Performance
            </h2>

            <p>
              Sales performance
              across all shops.
            </p>

          </div>

          <Store size={21} />

        </div>


        {shopPerformance.length ===
        0 ? (
          <div className="empty-state">

            <Store size={38} />

            <h3>
              No shops yet
            </h3>

            <p>
              Add shops to see
              performance data.
            </p>

          </div>
        ) : (
          <div className="table-wrapper">

            <table>

              <thead>

                <tr>
                  <th>
                    Shop
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Orders
                  </th>

                  <th>
                    Items
                  </th>

                  <th>
                    Sales
                  </th>
                </tr>

              </thead>


              <tbody>

                {shopPerformance.map(
                  (shop) => (
                    <tr
                      key={shop.id}
                    >

                      <td>
                        <strong>
                          {shop.name}
                        </strong>
                      </td>

                      <td>

                        <span
                          className={`status-badge ${
                            shop.isOpen
                              ? "open"
                              : "closed"
                          }`}
                        >
                          {shop.isOpen
                            ? "Open"
                            : "Closed"}
                        </span>

                      </td>

                      <td>
                        {shop.orders}
                      </td>

                      <td>
                        {shop.items}
                      </td>

                      <td>
                        <strong>
                          {formatCurrency(
                            shop.sales,
                          )}
                        </strong>
                      </td>

                    </tr>
                  ),
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>


      {/* TOP PRODUCTS */}

      <div
        className="dashboard-panel"
        style={{
          marginTop: "20px",
        }}
      >

        <div className="dashboard-panel-header">

          <div>

            <h2>
              Top Selling Products
            </h2>

            <p>
              Your most frequently
              sold products.
            </p>

          </div>

          <Package size={21} />

        </div>


        {topProducts.length ===
        0 ? (
          <div className="empty-state">

            <Package size={38} />

            <h3>
              No product sales yet
            </h3>

            <p>
              Product statistics
              appear after POS
              orders are created.
            </p>

          </div>
        ) : (
          <div className="table-wrapper">

            <table>

              <thead>

                <tr>
                  <th>
                    #
                  </th>

                  <th>
                    Product
                  </th>

                  <th>
                    Quantity
                  </th>

                  <th>
                    Sales
                  </th>
                </tr>

              </thead>


              <tbody>

                {topProducts.map(
                  (
                    product,
                    index,
                  ) => (
                    <tr
                      key={
                        product.name
                      }
                    >

                      <td>
                        <strong>
                          {index + 1}
                        </strong>
                      </td>

                      <td>
                        <strong>
                          {
                            product.name
                          }
                        </strong>
                      </td>

                      <td>
                        {
                          product.quantity
                        }
                      </td>

                      <td>
                        <strong>
                          {formatCurrency(
                            product.sales,
                          )}
                        </strong>
                      </td>

                    </tr>
                  ),
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>


      {/* TODAY'S PAYMENTS */}

      <div
        className="dashboard-panel"
        style={{
          marginTop: "20px",
        }}
      >

        <div className="dashboard-panel-header">

          <div>

            <h2>
              Today's Payments
            </h2>

            <p>
              How today's sales
              were collected.
            </p>

          </div>

          <CreditCard size={21} />

        </div>


        {todayPaymentBreakdown.length ===
        0 ? (
          <div className="empty-state">

            <CreditCard size={38} />

            <h3>
              No payments today
            </h3>

            <p>
              Payment breakdown
              will appear after
              today's orders.
            </p>

          </div>
        ) : (
          <div className="table-wrapper">

            <table>

              <thead>

                <tr>
                  <th>
                    Method
                  </th>

                  <th>
                    Orders
                  </th>

                  <th>
                    Amount
                  </th>
                </tr>

              </thead>


              <tbody>

                {todayPaymentBreakdown.map(
                  (payment) => {
                    const count =
                      todayOrders.filter(
                        (order) =>
                          order.payment_method ===
                          payment.method,
                      ).length;

                    return (
                      <tr
                        key={
                          payment.method
                        }
                      >

                        <td>
                          <strong>
                            {
                              payment.method
                            }
                          </strong>
                        </td>

                        <td>
                          {count}
                        </td>

                        <td>
                          <strong>
                            {formatCurrency(
                              payment.amount,
                            )}
                          </strong>
                        </td>

                      </tr>
                    );
                  },
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>


      {/* RECENT ORDERS */}

      <div
        className="dashboard-panel"
        style={{
          marginTop: "20px",
          marginBottom: "30px",
        }}
      >

        <div className="dashboard-panel-header">

          <div>

            <h2>
              Recent Orders
            </h2>

            <p>
              Latest transactions
              across all shops.
            </p>

          </div>

          <ShoppingBag size={21} />

        </div>


        {recentOrders.length ===
        0 ? (
          <div className="empty-state">

            <ShoppingBag size={38} />

            <h3>
              No orders yet
            </h3>

            <p>
              Start billing from
              POS to see orders
              here.
            </p>

          </div>
        ) : (
          <div className="table-wrapper">

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
                    Items
                  </th>

                  <th>
                    Payment
                  </th>

                  <th>
                    Total
                  </th>

                  <th>
                    Time
                  </th>
                </tr>

              </thead>


              <tbody>

                {recentOrders.map(
                  (order) => {
                    const shop =
                      shops.find(
                        (item) =>
                          item.id ===
                          order.shop_id,
                      );

                    return (
                      <tr
                        key={
                          order.id
                        }
                      >

                        <td>
                          <strong>
                            #{order.id}
                          </strong>
                        </td>

                        <td>
                          {shop?.name ||
                            `Shop #${order.shop_id}`}
                        </td>

                        <td>
                          {getOrderItems(
                            order,
                          )}
                        </td>

                        <td>
                          <span className="status-badge">
                            {
                              order.payment_method
                            }
                          </span>
                        </td>

                        <td>
                          <strong>
                            {formatCurrency(
                              getOrderTotal(
                                order,
                              ),
                            )}
                          </strong>
                        </td>

                        <td>
                          {new Date(
                            order.created_at,
                          ).toLocaleTimeString(
                            "en-IN",
                            {
                              hour: "2-digit",
                              minute:
                                "2-digit",
                            },
                          )}
                        </td>

                      </tr>
                    );
                  },
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>


      {/* PRODUCT CATALOG */}

      <div
        className="dashboard-panel"
        style={{
          marginBottom: "30px",
        }}
      >

        <div className="dashboard-panel-header">

          <div>

            <h2>
              Product Catalog
            </h2>

            <p>
              Current products
              across your shops.
            </p>

          </div>

          <Package size={21} />

        </div>


        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "15px",
          }}
        >

          <div>

            <span
              style={{
                fontSize: "13px",
                opacity: 0.65,
              }}
            >
              Total Products
            </span>

            <strong
              style={{
                display: "block",
                fontSize: "24px",
                marginTop: "5px",
              }}
            >
              {products.length}
            </strong>

          </div>


          <div>

            <span
              style={{
                fontSize: "13px",
                opacity: 0.65,
              }}
            >
              Shops
            </span>

            <strong
              style={{
                display: "block",
                fontSize: "24px",
                marginTop: "5px",
              }}
            >
              {shops.length}
            </strong>

          </div>


          <div>

            <span
              style={{
                fontSize: "13px",
                opacity: 0.65,
              }}
            >
              Workers
            </span>

            <strong
              style={{
                display: "block",
                fontSize: "24px",
                marginTop: "5px",
              }}
            >
              {workers.length}
            </strong>

          </div>

        </div>

      </div>

    </div>
  );
}


export default Dashboard;