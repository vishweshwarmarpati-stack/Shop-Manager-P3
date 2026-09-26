import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  CreditCard,
  IndianRupee,
  Plus,
  RefreshCw,
  Trash2,
  UserRound,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";

import {
  createSalaryPayment,
  createWorker,
  deleteSalaryPayment,
  deleteWorkerApi,
  fetchSalaryPayments,
  fetchShops,
  fetchWorkers,
  updateWorkerApi,
  type ApiSalaryPayment,
  type ApiWorker,
} from "../../services/api";

interface Shop {
  id: number;
  name: string;
  location: string;
  phone?: string;
  status?: string;
  is_open?: boolean;
}

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

  const [year, monthNumber] = month.split("-");

  return new Date(
    Number(year),
    Number(monthNumber) - 1,
    1,
  ).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function Workers() {
  const [workers, setWorkers] =
    useState<ApiWorker[]>([]);

  const [shops, setShops] =
    useState<Shop[]>([]);

  const [payments, setPayments] =
    useState<ApiSalaryPayment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [selectedMonth, setSelectedMonth] =
    useState(getCurrentMonth());

  const [showWorkerModal, setShowWorkerModal] =
    useState(false);

  const [showPaymentModal, setShowPaymentModal] =
    useState(false);

  const [showHistoryModal, setShowHistoryModal] =
    useState(false);

  const [editingWorker, setEditingWorker] =
    useState<ApiWorker | null>(null);

  const [selectedWorker, setSelectedWorker] =
    useState<ApiWorker | null>(null);

  const [workerName, setWorkerName] =
    useState("");

  const [workerShopId, setWorkerShopId] =
    useState("");

  const [workerSalary, setWorkerSalary] =
    useState("");

  const [paymentAmount, setPaymentAmount] =
    useState("");

  const [paymentMonth, setPaymentMonth] =
    useState(getCurrentMonth());

  const [paymentMethod, setPaymentMethod] =
    useState("Cash");

  const [paymentNotes, setPaymentNotes] =
    useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        workerData,
        shopData,
        paymentData,
      ] = await Promise.all([
        fetchWorkers(),
        fetchShops(),
        fetchSalaryPayments(),
      ]);

      setWorkers(workerData);
      setShops(shopData);
      setPayments(paymentData);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load worker data.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /*
   * ---------------------------------------------------------
   * MONTH-AWARE SALARY CALCULATIONS
   * ---------------------------------------------------------
   */

  function getWorkerPaymentsForMonth(
    workerId: number,
    month: string,
  ) {
    return payments.filter(
      (payment) =>
        payment.worker_id === workerId &&
        payment.payment_month === month,
    );
  }

  function getWorkerPaidAmount(
    workerId: number,
    month: string,
  ) {
    return getWorkerPaymentsForMonth(
      workerId,
      month,
    ).reduce(
      (total, payment) =>
        total + Number(payment.amount),
      0,
    );
  }

  function getWorkerSalaryStatus(
    worker: ApiWorker,
    month: string,
  ) {
    const salary =
      Number(worker.salary);

    const paidAmount =
      getWorkerPaidAmount(
        worker.id,
        month,
      );

    if (paidAmount >= salary) {
      return "paid";
    }

    if (paidAmount > 0) {
      return "partial";
    }

    return "pending";
  }

  const selectedMonthPaid =
    useMemo(() => {
      return payments
        .filter(
          (payment) =>
            payment.payment_month ===
            selectedMonth,
        )
        .reduce(
          (total, payment) =>
            total +
            Number(payment.amount),
          0,
        );
    }, [
      payments,
      selectedMonth,
    ]);

  const totalSalary = useMemo(() => {
    return workers.reduce(
      (total, worker) =>
        total + Number(worker.salary),
      0,
    );
  }, [workers]);

  const pendingSalary = useMemo(() => {
    return workers.reduce(
      (total, worker) => {
        const salary =
          Number(worker.salary);

        const paid =
          getWorkerPaidAmount(
            worker.id,
            selectedMonth,
          );

        return (
          total +
          Math.max(
            salary - paid,
            0,
          )
        );
      },
      0,
    );
  }, [
    workers,
    payments,
    selectedMonth,
  ]);

  const paidWorkersCount =
    useMemo(() => {
      return workers.filter(
        (worker) =>
          getWorkerSalaryStatus(
            worker,
            selectedMonth,
          ) === "paid",
      ).length;
    }, [
      workers,
      payments,
      selectedMonth,
    ]);

  const partialWorkersCount =
    useMemo(() => {
      return workers.filter(
        (worker) =>
          getWorkerSalaryStatus(
            worker,
            selectedMonth,
          ) === "partial",
      ).length;
    }, [
      workers,
      payments,
      selectedMonth,
    ]);

  const totalPaymentsThisMonth =
    useMemo(() => {
      return payments.filter(
        (payment) =>
          payment.payment_month ===
          selectedMonth,
      ).length;
    }, [
      payments,
      selectedMonth,
    ]);

  /*
   * ---------------------------------------------------------
   * HELPERS
   * ---------------------------------------------------------
   */

  function formatCurrency(
    amount: number,
  ) {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      },
    ).format(amount);
  }

  function resetWorkerForm() {
    setWorkerName("");
    setWorkerSalary("");

    setWorkerShopId(
      shops.length > 0
        ? String(shops[0].id)
        : "",
    );

    setEditingWorker(null);
  }

  function resetPaymentForm() {
    setPaymentAmount(
      selectedWorker
        ? String(selectedWorker.salary)
        : "",
    );

    setPaymentMonth(
      selectedMonth,
    );

    setPaymentMethod("Cash");
    setPaymentNotes("");
  }

  function openAddWorker() {
    setError("");
    setSuccess("");

    resetWorkerForm();

    setShowWorkerModal(true);
  }

  function openEditWorker(
    worker: ApiWorker,
  ) {
    setError("");
    setSuccess("");

    setEditingWorker(worker);

    setWorkerName(worker.name);

    setWorkerSalary(
      String(worker.salary),
    );

    setWorkerShopId(
      String(worker.shop_id),
    );

    setShowWorkerModal(true);
  }

  function openPaymentModal(
    worker: ApiWorker,
  ) {
    setError("");
    setSuccess("");

    setSelectedWorker(worker);

    const alreadyPaid =
      getWorkerPaidAmount(
        worker.id,
        selectedMonth,
      );

    const remaining =
      Math.max(
        Number(worker.salary) -
          alreadyPaid,
        0,
      );

    setPaymentAmount(
      String(
        remaining > 0
          ? remaining
          : Number(worker.salary),
      ),
    );

    setPaymentMonth(
      selectedMonth,
    );

    setPaymentMethod("Cash");
    setPaymentNotes("");

    setShowPaymentModal(true);
  }

  function openHistory(
    worker: ApiWorker,
  ) {
    setSelectedWorker(worker);

    setShowHistoryModal(true);
  }

  function closeAllModals() {
    if (saving) {
      return;
    }

    setShowWorkerModal(false);
    setShowPaymentModal(false);
    setShowHistoryModal(false);

    setSelectedWorker(null);
    setEditingWorker(null);

    resetWorkerForm();
    resetPaymentForm();
  }

  /*
   * ---------------------------------------------------------
   * WORKER CRUD
   * ---------------------------------------------------------
   */

  async function handleWorkerSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedName =
      workerName.trim();

    const salary =
      Number(workerSalary);

    const shopId =
      Number(workerShopId);

    if (!trimmedName) {
      setError(
        "Please enter the worker name.",
      );
      return;
    }

    if (
      !Number.isFinite(salary) ||
      salary <= 0
    ) {
      setError(
        "Please enter a valid salary.",
      );
      return;
    }

    if (
      !Number.isInteger(shopId) ||
      shopId <= 0
    ) {
      setError(
        "Please select a shop.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingWorker) {
        await updateWorkerApi(
          editingWorker.id,
          {
            name: trimmedName,
            shop_id: shopId,
            salary,
          },
        );

        setSuccess(
          `${trimmedName} was updated successfully.`,
        );
      } else {
        await createWorker({
          name: trimmedName,
          shop_id: shopId,
          salary,
          salary_paid: false,
        });

        setSuccess(
          `${trimmedName} was added successfully.`,
        );
      }

      setShowWorkerModal(false);

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save worker.",
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * SALARY PAYMENT
   * ---------------------------------------------------------
   */

  async function handlePaySalary(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedWorker) {
      setError(
        "No worker selected.",
      );
      return;
    }

    const amount =
      Number(paymentAmount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError(
        "Please enter a valid payment amount.",
      );
      return;
    }

    if (
      !/^\d{4}-\d{2}$/.test(
        paymentMonth,
      )
    ) {
      setError(
        "Please select a valid payment month.",
      );
      return;
    }

    const alreadyPaid =
      getWorkerPaidAmount(
        selectedWorker.id,
        paymentMonth,
      );

    const salary =
      Number(selectedWorker.salary);

    const remaining =
      Math.max(
        salary - alreadyPaid,
        0,
      );

    if (
      alreadyPaid >= salary
    ) {
      setError(
        `${selectedWorker.name}'s salary for ${formatMonth(
          paymentMonth,
        )} is already fully paid.`,
      );
      return;
    }

    if (amount > remaining) {
      setError(
        `Maximum remaining salary for ${formatMonth(
          paymentMonth,
        )} is ${formatCurrency(
          remaining,
        )}.`,
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await createSalaryPayment({
        worker_id:
          selectedWorker.id,
        amount,
        payment_month:
          paymentMonth,
        payment_method:
          paymentMethod,
        notes:
          paymentNotes.trim() ||
          undefined,
      });

      /*
       * IMPORTANT:
       *
       * We deliberately do NOT use salary_paid
       * to determine monthly status anymore.
       *
       * Status is calculated from salary payments
       * for the selected month.
       */

      const newPaidAmount =
        alreadyPaid + amount;

      const newStatus =
        newPaidAmount >= salary
          ? "fully paid"
          : "partially paid";

      setSuccess(
        `${formatCurrency(
          amount,
        )} recorded for ${
          selectedWorker.name
        } for ${formatMonth(
          paymentMonth,
        )}. Salary is now ${newStatus}.`,
      );

      setShowPaymentModal(false);

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to record salary payment.",
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * DELETE WORKER
   * ---------------------------------------------------------
   */

  async function handleDeleteWorker(
    worker: ApiWorker,
  ) {
    const confirmed =
      window.confirm(
        `Delete worker "${worker.name}"?\n\nTheir salary payment history will also be removed.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await deleteWorkerApi(
        worker.id,
      );

      setSuccess(
        `${worker.name} was deleted.`,
      );

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete worker.",
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * PAYMENT DELETE
   * ---------------------------------------------------------
   */

  async function handleDeletePayment(
    payment: ApiSalaryPayment,
  ) {
    const confirmed =
      window.confirm(
        `Delete this salary payment of ${formatCurrency(
          Number(payment.amount),
        )} for ${formatMonth(
          payment.payment_month,
        )}?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await deleteSalaryPayment(
        payment.id,
      );

      setSuccess(
        `Salary payment for ${formatMonth(
          payment.payment_month,
        )} was deleted.`,
      );

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete payment.",
      );
    }
  }

  function getWorkerPayments(
    workerId: number,
  ) {
    return payments
      .filter(
        (payment) =>
          payment.worker_id ===
          workerId,
      )
      .sort(
        (a, b) =>
          new Date(
            b.payment_date,
          ).getTime() -
          new Date(
            a.payment_date,
          ).getTime(),
      );
  }

  /*
   * ---------------------------------------------------------
   * STATUS UI
   * ---------------------------------------------------------
   */

  function renderSalaryStatus(
    worker: ApiWorker,
  ) {
    const status =
      getWorkerSalaryStatus(
        worker,
        selectedMonth,
      );

    const paid =
      getWorkerPaidAmount(
        worker.id,
        selectedMonth,
      );

    const salary =
      Number(worker.salary);

    if (status === "paid") {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            alignItems: "flex-start",
          }}
        >
          <span className="status-badge open">
            <CheckCircle2
              size={13}
              style={{
                marginRight: "4px",
                verticalAlign: "middle",
              }}
            />
            Paid
          </span>

          <small
            style={{
              opacity: 0.65,
            }}
          >
            {formatCurrency(
              paid,
            )}
          </small>
        </div>
      );
    }

    if (status === "partial") {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            alignItems: "flex-start",
          }}
        >
          <span
            className="status-badge"
            style={{
              background:
                "rgba(245, 158, 11, 0.12)",
              color:
                "#d97706",
              border:
                "1px solid rgba(245, 158, 11, 0.25)",
            }}
          >
            Partial
          </span>

          <small
            style={{
              opacity: 0.65,
            }}
          >
            {formatCurrency(
              paid,
            )}{" "}
            /{" "}
            {formatCurrency(
              salary,
            )}
          </small>
        </div>
      );
    }

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          alignItems: "flex-start",
        }}
      >
        <span className="status-badge closed">
          <Clock3
            size={13}
            style={{
              marginRight: "4px",
              verticalAlign: "middle",
            }}
          />
          Pending
        </span>

        <small
          style={{
            opacity: 0.65,
          }}
        >
          {formatCurrency(
            salary,
          )}{" "}
          due
        </small>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Workers</h1>

          <p>
            Manage workers, monthly
            salaries, payments and
            payment history.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
          <button
            type="button"
            className="secondary-button"
            onClick={loadData}
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

            Refresh
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={openAddWorker}
          >
            <Plus size={18} />

            Add Worker
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

      {/* MONTH SELECTOR */}

      <div
        className="dashboard-panel"
        style={{
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
            }}
          >
            Salary Period
          </h3>

          <p
            style={{
              margin:
                "5px 0 0",
              opacity: 0.65,
            }}
          >
            Salary status below is calculated
            specifically for this month.
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

      {/* STATS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div className="dashboard-stat-card">
          <UserRound size={22} />

          <span>Total Workers</span>

          <strong>
            {workers.length}
          </strong>
        </div>

        <div className="dashboard-stat-card">
          <IndianRupee size={22} />

          <span>
            Salary Due
          </span>

          <strong>
            {formatCurrency(
              totalSalary,
            )}
          </strong>

          <small
            style={{
              opacity: 0.6,
            }}
          >
            {formatMonth(
              selectedMonth,
            )}
          </small>
        </div>

        <div className="dashboard-stat-card">
          <CheckCircle2 size={22} />

          <span>
            Paid This Month
          </span>

          <strong>
            {formatCurrency(
              selectedMonthPaid,
            )}
          </strong>

          <small
            style={{
              opacity: 0.6,
            }}
          >
            {paidWorkersCount} fully paid
            {partialWorkersCount > 0
              ? ` · ${partialWorkersCount} partial`
              : ""}
          </small>
        </div>

        <div className="dashboard-stat-card">
          <Clock3 size={22} />

          <span>
            Remaining Salary
          </span>

          <strong>
            {formatCurrency(
              pendingSalary,
            )}
          </strong>

          <small
            style={{
              opacity: 0.6,
            }}
          >
            {totalPaymentsThisMonth} payment
            {totalPaymentsThisMonth === 1
              ? ""
              : "s"} this month
          </small>
        </div>
      </div>

      {/* WORKERS TABLE */}

      <div className="dashboard-panel">
        {loading ? (
          <div className="empty-state">
            Loading workers...
          </div>
        ) : workers.length === 0 ? (
          <div className="empty-state">
            <UserRound size={42} />

            <h3>
              No workers yet
            </h3>

            <p>
              Add your first worker
              to start managing
              salaries.
            </p>
          </div>
        ) : (
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
                    Worker
                  </th>

                  <th>
                    Shop
                  </th>

                  <th>
                    Monthly Salary
                  </th>

                  <th>
                    {
                      formatMonth(
                        selectedMonth,
                      )
                    }
                  </th>

                  <th>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {workers.map(
                  (worker) => {
                    const workerPayments =
                      getWorkerPayments(
                        worker.id,
                      );

                    const monthPaid =
                      getWorkerPaidAmount(
                        worker.id,
                        selectedMonth,
                      );

                    const remaining =
                      Math.max(
                        Number(
                          worker.salary,
                        ) -
                          monthPaid,
                        0,
                      );

                    const status =
                      getWorkerSalaryStatus(
                        worker,
                        selectedMonth,
                      );

                    return (
                      <tr
                        key={
                          worker.id
                        }
                      >
                        <td>
                          <strong>
                            {
                              worker.name
                            }
                          </strong>

                          <div
                            style={{
                              fontSize:
                                "12px",
                              opacity:
                                0.6,
                            }}
                          >
                            Worker #
                            {
                              worker.id
                            }
                          </div>
                        </td>

                        <td>
                          {
                            worker.shop_name ||
                            `Shop #${worker.shop_id}`
                          }
                        </td>

                        <td>
                          <strong>
                            {formatCurrency(
                              Number(
                                worker.salary,
                              ),
                            )}
                          </strong>
                        </td>

                        <td>
                          {renderSalaryStatus(
                            worker,
                          )}
                        </td>

                        <td>
                          <div
                            style={{
                              display:
                                "flex",
                              gap:
                                "7px",
                              flexWrap:
                                "wrap",
                            }}
                          >
                            {status !==
                              "paid" && (
                              <button
                                type="button"
                                className="primary-button"
                                onClick={() =>
                                  openPaymentModal(
                                    worker,
                                  )
                                }
                              >
                                <WalletCards
                                  size={
                                    15
                                  }
                                />

                                {monthPaid >
                                0
                                  ? "Pay Remaining"
                                  : "Pay"}
                              </button>
                            )}

                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() =>
                                openHistory(
                                  worker,
                                )
                              }
                            >
                              <CreditCard
                                size={
                                  15
                                }
                              />

                              History (
                              {
                                workerPayments.length
                              }
                              )
                            </button>

                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() =>
                                openEditWorker(
                                  worker,
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="danger-button"
                              onClick={() =>
                                handleDeleteWorker(
                                  worker,
                                )
                              }
                            >
                              <Trash2
                                size={
                                  15
                                }
                              />
                            </button>
                          </div>

                          {remaining >
                            0 && (
                            <div
                              style={{
                                fontSize:
                                  "12px",
                                opacity:
                                  0.55,
                                marginTop:
                                  "6px",
                              }}
                            >
                              Remaining:{" "}
                              {formatCurrency(
                                remaining,
                              )}
                            </div>
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

      {/* ADD / EDIT WORKER MODAL */}

      {showWorkerModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h2>
                  {editingWorker
                    ? "Edit Worker"
                    : "Add Worker"}
                </h2>

                <p>
                  Manage worker
                  information.
                </p>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={
                  closeAllModals
                }
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={
                handleWorkerSubmit
              }
              className="form-grid"
            >
              <div className="form-field">
                <label>
                  Worker Name
                </label>

                <input
                  value={
                    workerName
                  }
                  onChange={(
                    event,
                  ) =>
                    setWorkerName(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Example: Ravi"
                  disabled={saving}
                />
              </div>

              <div className="form-field">
                <label>
                  Shop
                </label>

                <select
                  value={
                    workerShopId
                  }
                  onChange={(
                    event,
                  ) =>
                    setWorkerShopId(
                      event.target
                        .value,
                    )
                  }
                  disabled={saving}
                >
                  {shops.map(
                    (shop) => (
                      <option
                        key={
                          shop.id
                        }
                        value={String(
                          shop.id,
                        )}
                      >
                        {shop.name}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="form-field">
                <label>
                  Monthly Salary
                </label>

                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={
                    workerSalary
                  }
                  onChange={(
                    event,
                  ) =>
                    setWorkerSalary(
                      event.target
                        .value,
                    )
                  }
                  placeholder="15000"
                  disabled={saving}
                />
              </div>

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "flex-end",
                  gap: "10px",
                }}
              >
                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    closeAllModals
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  <Plus size={17} />

                  {saving
                    ? "Saving..."
                    : editingWorker
                      ? "Save Changes"
                      : "Add Worker"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAY SALARY MODAL */}

      {showPaymentModal &&
        selectedWorker && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-header">
                <div>
                  <h2>
                    Pay Salary
                  </h2>

                  <p>
                    {
                      selectedWorker.name
                    }{" "}
                    ·{" "}
                    {
                      formatMonth(
                        paymentMonth,
                      )
                    }
                  </p>
                </div>

                <button
                  type="button"
                  className="icon-button"
                  onClick={
                    closeAllModals
                  }
                  disabled={saving}
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={
                  handlePaySalary
                }
                className="form-grid"
              >
                <div
                  style={{
                    padding:
                      "14px",
                    borderRadius:
                      "10px",
                    background:
                      "rgba(59, 130, 246, 0.08)",
                    border:
                      "1px solid rgba(59, 130, 246, 0.15)",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "13px",
                      opacity:
                        0.7,
                    }}
                  >
                    Monthly salary
                  </div>

                  <strong>
                    {formatCurrency(
                      Number(
                        selectedWorker.salary,
                      ),
                    )}
                  </strong>

                  <div
                    style={{
                      fontSize:
                        "13px",
                      marginTop:
                        "6px",
                    }}
                  >
                    Already paid:{" "}
                    {formatCurrency(
                      getWorkerPaidAmount(
                        selectedWorker.id,
                        paymentMonth,
                      ),
                    )}
                  </div>

                  <div
                    style={{
                      fontSize:
                        "13px",
                      marginTop:
                        "3px",
                    }}
                  >
                    Remaining:{" "}
                    {formatCurrency(
                      Math.max(
                        Number(
                          selectedWorker.salary,
                        ) -
                          getWorkerPaidAmount(
                            selectedWorker.id,
                            paymentMonth,
                          ),
                        0,
                      ),
                    )}
                  </div>
                </div>

                <div className="form-field">
                  <label>
                    Payment Amount
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={
                      paymentAmount
                    }
                    onChange={(
                      event,
                    ) =>
                      setPaymentAmount(
                        event.target
                          .value,
                      )
                    }
                    disabled={saving}
                  />
                </div>

                <div className="form-field">
                  <label>
                    Salary Month
                  </label>

                  <input
                    type="month"
                    value={
                      paymentMonth
                    }
                    onChange={(
                      event,
                    ) =>
                      setPaymentMonth(
                        event.target
                          .value,
                      )
                    }
                    disabled={saving}
                  />
                </div>

                <div className="form-field">
                  <label>
                    Payment Method
                  </label>

                  <select
                    value={
                      paymentMethod
                    }
                    onChange={(
                      event,
                    ) =>
                      setPaymentMethod(
                        event.target
                          .value,
                      )
                    }
                    disabled={saving}
                  >
                    <option value="Cash">
                      Cash
                    </option>

                    <option value="UPI">
                      UPI
                    </option>

                    <option value="Bank Transfer">
                      Bank Transfer
                    </option>

                    <option value="Card">
                      Card
                    </option>
                  </select>
                </div>

                <div className="form-field">
                  <label>
                    Notes
                  </label>

                  <textarea
                    value={
                      paymentNotes
                    }
                    onChange={(
                      event,
                    ) =>
                      setPaymentNotes(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Optional payment note..."
                    rows={3}
                    disabled={saving}
                  />
                </div>

                <div
                  style={{
                    padding:
                      "12px",
                    borderRadius:
                      "10px",
                    background:
                      "rgba(34, 197, 94, 0.08)",
                  }}
                >
                  <strong>
                    Recording:
                  </strong>{" "}
                  {formatCurrency(
                    Number(
                      paymentAmount ||
                        0,
                    ),
                  )}{" "}
                  for{" "}
                  {
                    selectedWorker.name
                  }{" "}
                  (
                  {
                    formatMonth(
                      paymentMonth,
                    )
                  }
                  )
                </div>

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "flex-end",
                    gap: "10px",
                  }}
                >
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={
                      closeAllModals
                    }
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={saving}
                  >
                    <IndianRupee
                      size={17}
                    />

                    {saving
                      ? "Recording..."
                      : "Record Payment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* HISTORY MODAL */}

      {showHistoryModal &&
        selectedWorker && (
          <div className="modal-overlay">
            <div
              className="modal-card"
              style={{
                maxWidth:
                  "700px",
              }}
            >
              <div className="modal-header">
                <div>
                  <h2>
                    Salary History
                  </h2>

                  <p>
                    {
                      selectedWorker.name
                    }
                  </p>
                </div>

                <button
                  type="button"
                  className="icon-button"
                  onClick={
                    closeAllModals
                  }
                >
                  <X size={20} />
                </button>
              </div>

              {getWorkerPayments(
                selectedWorker.id,
              ).length === 0 ? (
                <div className="empty-state">
                  <WalletCards
                    size={40}
                  />

                  <h3>
                    No payments
                    recorded
                  </h3>

                  <p>
                    Salary payments
                    for this worker
                    will appear
                    here.
                  </p>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      marginBottom:
                        "15px",
                      padding:
                        "12px 14px",
                      borderRadius:
                        "10px",
                      background:
                        "rgba(59, 130, 246, 0.08)",
                    }}
                  >
                    <strong>
                      Total recorded:
                    </strong>{" "}
                    {formatCurrency(
                      getWorkerPayments(
                        selectedWorker.id,
                      ).reduce(
                        (
                          total,
                          payment,
                        ) =>
                          total +
                          Number(
                            payment.amount,
                          ),
                        0,
                      ),
                    )}
                  </div>

                  <div
                    style={{
                      display:
                        "grid",
                      gap: "10px",
                      maxHeight:
                        "450px",
                      overflowY:
                        "auto",
                    }}
                  >
                    {getWorkerPayments(
                      selectedWorker.id,
                    ).map(
                      (payment) => (
                        <div
                          key={
                            payment.id
                          }
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            gap:
                              "15px",
                            alignItems:
                              "center",
                            padding:
                              "14px",
                            border:
                              "1px solid var(--border-color)",
                            borderRadius:
                              "10px",
                          }}
                        >
                          <div>
                            <strong>
                              {formatMonth(
                                payment.payment_month,
                              )}
                            </strong>

                            <div
                              style={{
                                fontSize:
                                  "13px",
                                opacity:
                                  0.7,
                                marginTop:
                                  "4px",
                              }}
                            >
                              {
                                payment.payment_method
                              }

                              {payment.notes
                                ? ` · ${payment.notes}`
                                : ""}
                            </div>

                            <div
                              style={{
                                fontSize:
                                  "12px",
                                opacity:
                                  0.55,
                                marginTop:
                                  "3px",
                              }}
                            >
                              {new Date(
                                payment.payment_date,
                              ).toLocaleString(
                                "en-IN",
                              )}
                            </div>
                          </div>

                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap:
                                "12px",
                            }}
                          >
                            <strong>
                              {formatCurrency(
                                Number(
                                  payment.amount,
                                ),
                              )}
                            </strong>

                            <button
                              type="button"
                              className="danger-button"
                              onClick={() =>
                                handleDeletePayment(
                                  payment,
                                )
                              }
                            >
                              <Trash2
                                size={
                                  15
                                }
                              />
                            </button>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
    </div>
  );
}

export default Workers;