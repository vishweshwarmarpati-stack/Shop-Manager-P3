import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CircleDollarSign,
  CreditCard,
  Package,
  RefreshCw,
  ShoppingBag,
  Store,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import {
  fetchOrders,
  fetchSalaryPayments,
  fetchShops,
  fetchWorkers,
  type ApiOrder,
  type ApiSalaryPayment,
  type ApiShop,
  type ApiWorker,
} from "../../services/api";

import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

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

  const [year, monthNumber] =
    month.split("-");

  return new Date(
    Number(year),
    Number(monthNumber) - 1,
    1,
  ).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function Analytics() {
  const [orders, setOrders] =
    useState<ApiOrder[]>([]);

  const [shops, setShops] =
    useState<ApiShop[]>([]);

  const [workers, setWorkers] =
    useState<ApiWorker[]>([]);

  const [salaryPayments, setSalaryPayments] =
    useState<ApiSalaryPayment[]>([]);

  const [selectedMonth, setSelectedMonth] =
    useState(getCurrentMonth());

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError("");

      const [
        ordersData,
        shopsData,
        workersData,
        salaryPaymentsData,
      ] = await Promise.all([
        fetchOrders(),
        fetchShops(),
        fetchWorkers(),
        fetchSalaryPayments(),
      ]);

      setOrders(ordersData);
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
          : "Failed to load analytics.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  /* =========================================================
     HELPERS
     ========================================================= */

  function formatCurrency(amount: number) {
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
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const year =
      date.getFullYear();

    const month = String(
      date.getMonth() + 1,
    ).padStart(2, "0");

    const day = String(
      date.getDate(),
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function getPaymentMonth(
    dateString: string,
  ) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const year =
      date.getFullYear();

    const month = String(
      date.getMonth() + 1,
    ).padStart(2, "0");

    return `${year}-${month}`;
  }

  function getTodayKey() {
    const now = new Date();

    const year =
      now.getFullYear();

    const month = String(
      now.getMonth() + 1,
    ).padStart(2, "0");

    const day = String(
      now.getDate(),
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function formatDateLabel(
    dateKey: string,
  ) {
    const [year, month, day] =
      dateKey
        .split("-")
        .map(Number);

    return new Date(
      year,
      month - 1,
      day,
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
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
        Number(item.quantity || 0),
      0,
    );
  }

  /* =========================================================
     BASIC SALES KPIs
     ========================================================= */

  const totalSales = useMemo(() => {
    return orders.reduce(
      (sum, order) =>
        sum + getOrderTotal(order),
      0,
    );
  }, [orders]);

  const totalOrders =
    orders.length;

  const itemsSold = useMemo(() => {
    return orders.reduce(
      (sum, order) =>
        sum +
        getOrderItems(order),
      0,
    );
  }, [orders]);

  const averageOrder =
    totalOrders > 0
      ? totalSales / totalOrders
      : 0;

  /* =========================================================
     TODAY
     ========================================================= */

  const todayKey = getTodayKey();

  const todayOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        getLocalDateKey(
          order.created_at,
        ) === todayKey,
    );
  }, [orders, todayKey]);

  const todaySales = useMemo(() => {
    return todayOrders.reduce(
      (sum, order) =>
        sum + getOrderTotal(order),
      0,
    );
  }, [todayOrders]);

  const todayItems = useMemo(() => {
    return todayOrders.reduce(
      (sum, order) =>
        sum + getOrderItems(order),
      0,
    );
  }, [todayOrders]);

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
     SELECTED MONTH SALARY ANALYTICS
     ========================================================= */

  const selectedMonthPayments =
    useMemo(() => {
      return salaryPayments.filter(
        (payment) =>
          payment.payment_month ===
          selectedMonth,
      );
    }, [
      salaryPayments,
      selectedMonth,
    ]);

  const selectedMonthSalaryPaid =
    useMemo(() => {
      return selectedMonthPayments.reduce(
        (sum, payment) =>
          sum +
          Number(
            payment.amount || 0,
          ),
        0,
      );
    }, [
      selectedMonthPayments,
    ]);

  const selectedMonthSalaryDue =
    useMemo(() => {
      return workers.reduce(
        (sum, worker) =>
          sum +
          Number(worker.salary || 0),
        0,
      );
    }, [workers]);

  const selectedMonthSalaryRemaining =
    Math.max(
      selectedMonthSalaryDue -
        selectedMonthSalaryPaid,
      0,
    );

  /*
   * IMPORTANT:
   *
   * Salary expense here means salary payments
   * actually recorded for the selected month.
   *
   * It does NOT blindly assume every worker's
   * full salary has already been paid.
   */

  const selectedMonthSales =
    useMemo(() => {
      return orders
        .filter(
          (order) =>
            getPaymentMonth(
              order.created_at,
            ) === selectedMonth,
        )
        .reduce(
          (sum, order) =>
            sum + getOrderTotal(order),
          0,
        );
    }, [
      orders,
      selectedMonth,
    ]);

  const selectedMonthOrders =
    useMemo(() => {
      return orders.filter(
        (order) =>
          getPaymentMonth(
            order.created_at,
          ) === selectedMonth,
      );
    }, [
      orders,
      selectedMonth,
    ]);

  const selectedMonthNetRevenue =
    selectedMonthSales -
    selectedMonthSalaryPaid;

  const salaryPaymentCount =
    selectedMonthPayments.length;

  /* =========================================================
     SALARY PAYMENT STATUS
     ========================================================= */

  const fullyPaidWorkers =
    useMemo(() => {
      return workers.filter(
        (worker) => {
          const paid =
            selectedMonthPayments
              .filter(
                (payment) =>
                  payment.worker_id ===
                  worker.id,
              )
              .reduce(
                (sum, payment) =>
                  sum +
                  Number(
                    payment.amount ||
                      0,
                  ),
                0,
              );

          return (
            paid >=
            Number(worker.salary)
          );
        },
      ).length;
    }, [
      workers,
      selectedMonthPayments,
    ]);

  const partiallyPaidWorkers =
    useMemo(() => {
      return workers.filter(
        (worker) => {
          const paid =
            selectedMonthPayments
              .filter(
                (payment) =>
                  payment.worker_id ===
                  worker.id,
              )
              .reduce(
                (sum, payment) =>
                  sum +
                  Number(
                    payment.amount ||
                      0,
                  ),
                0,
              );

          return (
            paid > 0 &&
            paid <
              Number(worker.salary)
          );
        },
      ).length;
    }, [
      workers,
      selectedMonthPayments,
    ]);

  const pendingWorkers =
    workers.length -
    fullyPaidWorkers -
    partiallyPaidWorkers;

  /* =========================================================
     SALES TREND
     ========================================================= */

  const salesTrend = useMemo(() => {
    const dayMap = new Map<
      string,
      {
        date: string;
        sales: number;
        orders: number;
        items: number;
      }
    >();

    orders.forEach((order) => {
      const key =
        getLocalDateKey(
          order.created_at,
        );

      const orderItems =
        getOrderItems(order);

      const existing =
        dayMap.get(key);

      if (existing) {
        existing.sales +=
          getOrderTotal(order);

        existing.orders += 1;
        existing.items +=
          orderItems;
      } else {
        dayMap.set(key, {
          date: key,
          sales:
            getOrderTotal(order),
          orders: 1,
          items: orderItems,
        });
      }
    });

    return Array.from(
      dayMap.values(),
    )
      .sort((a, b) =>
        a.date.localeCompare(
          b.date,
        ),
      )
      .slice(-7)
      .map((item) => ({
        ...item,
        label:
          formatDateLabel(
            item.date,
          ),
      }));
  }, [orders]);

  /* =========================================================
     PAYMENT BREAKDOWN
     ========================================================= */

  const paymentBreakdown =
    useMemo(() => {
      const paymentMap =
        new Map<
          string,
          {
            method: string;
            amount: number;
            orders: number;
          }
        >();

      orders.forEach((order) => {
        const method =
          order.payment_method ||
          "Unknown";

        const existing =
          paymentMap.get(
            method,
          );

        if (existing) {
          existing.amount +=
            getOrderTotal(order);

          existing.orders += 1;
        } else {
          paymentMap.set(
            method,
            {
              method,
              amount:
                getOrderTotal(
                  order,
                ),
              orders: 1,
            },
          );
        }
      });

      return Array.from(
        paymentMap.values(),
      ).sort(
        (a, b) =>
          b.amount -
          a.amount,
      );
    }, [orders]);

  const paymentChartData =
    paymentBreakdown.map(
      (item) => ({
        name: item.method,
        value: item.amount,
      }),
    );

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
          };
        })
        .sort(
          (a, b) =>
            b.sales - a.sales,
        );
    }, [shops, orders]);

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

      orders.forEach((order) => {
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
      });

      return Array.from(
        productMap.values(),
      )
        .sort(
          (a, b) =>
            b.quantity -
            a.quantity,
        )
        .slice(0, 10);
    }, [orders]);

  /* =========================================================
     TOP PAYMENT / SHOP
     ========================================================= */

  const topPaymentMethod =
    paymentBreakdown[0];

  const topShop =
    shopPerformance[0];

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
              alignItems:
                "center",
              gap: "10px",
            }}
          >
            <h1
              style={{
                margin: 0,
              }}
            >
              Analytics
            </h1>

            <span className="status-badge open">
              LIVE DATA
            </span>
          </div>

          <p>
            Understand sales,
            salaries, revenue,
            products, payments
            and shop performance.
          </p>

          {lastUpdated && (
            <div
              style={{
                marginTop: "6px",
                fontSize: "12px",
                opacity: 0.6,
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
            loadAnalytics
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
            marginBottom:
              "20px",
          }}
        >
          <BarChart3 size={18} />

          <span>{error}</span>
        </div>
      )}

      {/* MONTH SELECTOR */}

      <div
        className="dashboard-panel"
        style={{
          marginBottom:
            "20px",
          display: "flex",
          alignItems:
            "center",
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
            Financial Period
          </h2>

          <p
            style={{
              margin:
                "5px 0 0",
              opacity: 0.65,
            }}
          >
            View salary payments
            and net revenue for
            a specific month.
          </p>
        </div>

        <div
          className="form-field"
          style={{
            minWidth:
              "210px",
            margin: 0,
          }}
        >
          <label>
            Selected Month
          </label>

          <input
            type="month"
            value={
              selectedMonth
            }
            onChange={(
              event,
            ) =>
              setSelectedMonth(
                event.target
                  .value,
              )
            }
          />
        </div>
      </div>

      {/* TODAY */}

      <div
        className="dashboard-panel"
        style={{
          marginBottom:
            "20px",
        }}
      >
        <div className="dashboard-panel-header">
          <div>
            <h2>
              Today
            </h2>

            <p>
              Today's business
              activity.
            </p>
          </div>

          <TrendingUp size={21} />
        </div>

        <div
          className="dashboard-stats"
          style={{
            marginTop: "5px",
          }}
        >
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon">
              <CircleDollarSign
                size={20}
              />
            </div>

            <div>
              <span>
                Today's Sales
              </span>

              <strong>
                {formatCurrency(
                  todaySales,
                )}
              </strong>

              <small>
                {
                  todayOrders.length
                }{" "}
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
                Today's Orders
              </span>

              <strong>
                {
                  todayOrders.length
                }
              </strong>

              <small>
                {todayItems} items
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
                Recorded salary
                payments
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
        </div>
      </div>

      {/* MONTHLY FINANCIAL SUMMARY */}

      <div
        className="dashboard-panel"
        style={{
          marginBottom:
            "20px",
        }}
      >
        <div className="dashboard-panel-header">
          <div>
            <h2>
              {formatMonth(
                selectedMonth,
              )}{" "}
              Financial Summary
            </h2>

            <p>
              Sales and recorded
              salary expenses for
              the selected month.
            </p>
          </div>

          <CircleDollarSign
            size={21}
          />
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
                Monthly Sales
              </span>

              <strong>
                {formatCurrency(
                  selectedMonthSales,
                )}
              </strong>

              <small>
                {
                  selectedMonthOrders.length
                }{" "}
                orders
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
                Salary Expense
              </span>

              <strong>
                {formatCurrency(
                  selectedMonthSalaryPaid,
                )}
              </strong>

              <small>
                {
                  salaryPaymentCount
                }{" "}
                payments
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
                  selectedMonthNetRevenue,
                )}
              </strong>

              <small>
                Sales − salary expense
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
                  selectedMonthSalaryRemaining,
                )}
              </strong>

              <small>
                {
                  pendingWorkers
                }{" "}
                pending ·{" "}
                {
                  partiallyPaidWorkers
                }{" "}
                partial
              </small>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop:
              "16px",
            padding:
              "14px 16px",
            borderRadius:
              "10px",
            background:
              "rgba(59, 130, 246, 0.08)",
            border:
              "1px solid rgba(59, 130, 246, 0.15)",
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <span>
            <strong>
              Workers:
            </strong>{" "}
            {workers.length}
          </span>

          <span>
            <strong>
              Fully paid:
            </strong>{" "}
            {fullyPaidWorkers}
          </span>

          <span>
            <strong>
              Partial:
            </strong>{" "}
            {partiallyPaidWorkers}
          </span>

          <span>
            <strong>
              Pending:
            </strong>{" "}
            {pendingWorkers}
          </span>
        </div>
      </div>

      {/* OVERALL KPIs */}

      <div className="dashboard-stats">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <CircleDollarSign
              size={20}
            />
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
          <div className="dashboard-stat-icon">
            <ShoppingBag
              size={20}
            />
          </div>

          <div>
            <span>
              Total Orders
            </span>

            <strong>
              {totalOrders}
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
              {itemsSold}
            </strong>
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
              Average Order
            </span>

            <strong>
              {formatCurrency(
                averageOrder,
              )}
            </strong>
          </div>
        </div>
      </div>

      {/* BUSINESS SNAPSHOT */}

      {!loading &&
        orders.length > 0 && (
          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "15px",
              marginTop:
                "20px",
            }}
          >
            <div
              className="dashboard-panel"
              style={{
                margin: 0,
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: "10px",
                }}
              >
                <CreditCard
                  size={19}
                />

                <span
                  style={{
                    fontSize:
                      "13px",
                    opacity:
                      0.65,
                  }}
                >
                  Most Used Payment
                </span>
              </div>

              <strong
                style={{
                  display:
                    "block",
                  marginTop:
                    "8px",
                  fontSize:
                    "20px",
                }}
              >
                {topPaymentMethod
                  ?.method ||
                  "—"}
              </strong>

              <span
                style={{
                  fontSize:
                    "12px",
                  opacity:
                    0.6,
                }}
              >
                {topPaymentMethod
                  ? formatCurrency(
                      topPaymentMethod.amount,
                    )
                  : "No payment data"}
              </span>
            </div>

            <div
              className="dashboard-panel"
              style={{
                margin: 0,
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: "10px",
                }}
              >
                <Store size={19} />

                <span
                  style={{
                    fontSize:
                      "13px",
                    opacity:
                      0.65,
                  }}
                >
                  Highest Sales Shop
                </span>
              </div>

              <strong
                style={{
                  display:
                    "block",
                  marginTop:
                    "8px",
                  fontSize:
                    "20px",
                }}
              >
                {topShop?.name ||
                  "—"}
              </strong>

              <span
                style={{
                  fontSize:
                    "12px",
                  opacity:
                    0.6,
                }}
              >
                {topShop
                  ? formatCurrency(
                      topShop.sales,
                    )
                  : "No shop data"}
              </span>
            </div>

            <div
              className="dashboard-panel"
              style={{
                margin: 0,
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: "10px",
                }}
              >
                <Package size={19} />

                <span
                  style={{
                    fontSize:
                      "13px",
                    opacity:
                      0.65,
                  }}
                >
                  Products Tracked
                </span>
              </div>

              <strong
                style={{
                  display:
                    "block",
                  marginTop:
                    "8px",
                  fontSize:
                    "20px",
                }}
              >
                {topProducts.length}
              </strong>

              <span
                style={{
                  fontSize:
                    "12px",
                  opacity:
                    0.6,
                }}
              >
                Top products with
                sales
              </span>
            </div>
          </div>
        )}

      {/* EMPTY STATE */}

      {!loading &&
        orders.length === 0 && (
          <div
            className="dashboard-panel"
            style={{
              marginTop:
                "20px",
            }}
          >
            <div className="empty-state">
              <BarChart3 size={42} />

              <h3>
                No analytics data
                yet
              </h3>

              <p>
                Create orders through
                POS to start seeing
                sales, payment and
                product analytics.
              </p>
            </div>
          </div>
        )}

      {/* SALES TREND */}

      <div
        className="dashboard-panel"
        style={{
          marginTop:
            "20px",
        }}
      >
        <div className="dashboard-panel-header">
          <div>
            <h2>
              Sales Trend
            </h2>

            <p>
              Sales across the
              latest seven available
              days.
            </p>
          </div>

          <BarChart3 size={20} />
        </div>

        <div
          style={{
            width: "100%",
            height: "330px",
          }}
        >
          {salesTrend.length >
          0 ? (
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={salesTrend}
                margin={{
                  top: 10,
                  right: 10,
                  left: 5,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="label"
                />

                <YAxis
                  tickFormatter={(
                    value,
                  ) =>
                    `₹${Number(
                      value,
                    ).toLocaleString(
                      "en-IN",
                    )}`
                  }
                />

                <Tooltip
                  formatter={(
                    value,
                  ) =>
                    formatCurrency(
                      Number(value),
                    )
                  }
                />

                <Bar
                  dataKey="sales"
                  name="Sales"
                  fill="currentColor"
                  radius={[
                    6,
                    6,
                    0,
                    0,
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <BarChart3 size={34} />

              <h3>
                No sales data
              </h3>

              <p>
                Sales charts will
                appear after orders
                are created.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* PAYMENT + SHOP */}

      <div
        style={{
          display:
            "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
          marginTop:
            "20px",
        }}
      >
        {/* PAYMENT */}

        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>
                Payment Breakdown
              </h2>

              <p>
                Revenue by payment
                method.
              </p>
            </div>

            <CreditCard size={20} />
          </div>

          <div
            style={{
              width: "100%",
              height: "310px",
            }}
          >
            {paymentChartData.length >
            0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={
                      paymentChartData
                    }
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={92}
                    label
                  >
                    {paymentChartData.map(
                      (_, index) => (
                        <Cell
                          key={
                            index
                          }
                        />
                      ),
                    )}
                  </Pie>

                  <Tooltip
                    formatter={(
                      value,
                    ) =>
                      formatCurrency(
                        Number(value),
                      )
                    }
                  />

                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <CreditCard size={34} />

                <h3>
                  No payment data
                </h3>
              </div>
            )}
          </div>
        </div>

        {/* SHOP PERFORMANCE */}

        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>
                Shop Performance
              </h2>

              <p>
                Compare sales across
                your shops.
              </p>
            </div>

            <Store size={20} />
          </div>

          <div
            style={{
              width: "100%",
              height: "310px",
            }}
          >
            {shopPerformance.length >
            0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={
                    shopPerformance
                  }
                  layout="vertical"
                  margin={{
                    left: 10,
                    right: 20,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    type="number"
                    tickFormatter={(
                      value,
                    ) =>
                      `₹${Number(
                        value,
                      ).toLocaleString(
                        "en-IN",
                      )}`
                    }
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                  />

                  <Tooltip
                    formatter={(
                      value,
                    ) =>
                      formatCurrency(
                        Number(value),
                      )
                    }
                  />

                  <Bar
                    dataKey="sales"
                    name="Sales"
                    fill="currentColor"
                    radius={[
                      0,
                      6,
                      6,
                      0,
                    ]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <Store size={34} />

                <h3>
                  No shop data
                </h3>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PAYMENT TABLE */}

      {paymentBreakdown.length >
        0 && (
        <div
          className="dashboard-panel"
          style={{
            marginTop:
              "20px",
          }}
        >
          <div className="dashboard-panel-header">
            <div>
              <h2>
                Payment Summary
              </h2>

              <p>
                Detailed revenue by
                payment method.
              </p>
            </div>

            <CreditCard size={20} />
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>
                    Payment Method
                  </th>

                  <th>
                    Orders
                  </th>

                  <th>
                    Revenue
                  </th>

                  <th>
                    Share
                  </th>
                </tr>
              </thead>

              <tbody>
                {paymentBreakdown.map(
                  (payment) => {
                    const percentage =
                      totalSales >
                      0
                        ? (payment.amount /
                            totalSales) *
                          100
                        : 0;

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
                          {
                            payment.orders
                          }
                        </td>

                        <td>
                          <strong>
                            {formatCurrency(
                              payment.amount,
                            )}
                          </strong>
                        </td>

                        <td>
                          {percentage.toFixed(
                            1,
                          )}
                          %
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TOP PRODUCTS */}

      <div
        className="dashboard-panel"
        style={{
          marginTop:
            "20px",
        }}
      >
        <div className="dashboard-panel-header">
          <div>
            <h2>
              Top Selling Products
            </h2>

            <p>
              Products ranked by
              quantity sold.
            </p>
          </div>

          <Package size={20} />
        </div>

        {topProducts.length ===
        0 ? (
          <div className="empty-state">
            <Package size={36} />

            <h3>
              No product sales
            </h3>

            <p>
              Product analytics
              will appear after
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
                    Quantity Sold
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
                          {index +
                            1}
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

      {/* SHOP SUMMARY */}

      {shopPerformance.length >
        0 && (
        <div
          className="dashboard-panel"
          style={{
            marginTop:
              "20px",
          }}
        >
          <div className="dashboard-panel-header">
            <div>
              <h2>
                Shop Summary
              </h2>

              <p>
                Orders and items
                processed by each
                shop.
              </p>
            </div>

            <Store size={20} />
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>
                    Shop
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

                  <th>
                    Average Order
                  </th>
                </tr>
              </thead>

              <tbody>
                {shopPerformance.map(
                  (shop) => {
                    const average =
                      shop.orders >
                      0
                        ? shop.sales /
                          shop.orders
                        : 0;

                    return (
                      <tr
                        key={
                          shop.id
                        }
                      >
                        <td>
                          <strong>
                            {
                              shop.name
                            }
                          </strong>
                        </td>

                        <td>
                          {
                            shop.orders
                          }
                        </td>

                        <td>
                          {
                            shop.items
                          }
                        </td>

                        <td>
                          <strong>
                            {formatCurrency(
                              shop.sales,
                            )}
                          </strong>
                        </td>

                        <td>
                          {formatCurrency(
                            average,
                          )}
                        </td>
                      </tr>
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

export default Analytics;