import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import {
  createUserApi,
  deleteUserApi,
  fetchShops,
  fetchUsers,
  updateUserApi,
  type ApiShop,
  type ApiUser,
} from "../../services/api";


type UserRole =
  | "ADMIN"
  | "CASHIER";


interface UserForm {
  username: string;
  password: string;
  role: UserRole;
  shop_id: number | null;
}


const emptyForm: UserForm = {
  username: "",
  password: "",
  role: "CASHIER",
  shop_id: null,
};


function Users() {
  const [
    users,
    setUsers,
  ] = useState<ApiUser[]>([]);

  const [
    shops,
    setShops,
  ] = useState<ApiShop[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    modalError,
    setModalError,
  ] = useState("");

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    editingUser,
    setEditingUser,
  ] = useState<ApiUser | null>(
    null,
  );

  const [
    form,
    setForm,
  ] = useState<UserForm>(
    emptyForm,
  );


  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [
        usersData,
        shopsData,
      ] = await Promise.all([
        fetchUsers(),
        fetchShops(),
      ]);

      setUsers(usersData);
      setShops(shopsData);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load users.",
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadData();
  }, []);


  function openCreateModal() {
    setEditingUser(null);

    setForm({
      ...emptyForm,
    });

    setModalError("");
    setShowModal(true);
  }


  function openEditModal(
    user: ApiUser,
  ) {
    setEditingUser(user);

    setForm({
      username: user.username,
      password: "",
      role:
        user.role === "ADMIN"
          ? "ADMIN"
          : "CASHIER",
      shop_id: user.shop_id,
    });

    setModalError("");
    setShowModal(true);
  }


  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingUser(null);
    setModalError("");

    setForm({
      ...emptyForm,
    });
  }


  function handleRoleChange(
    role: UserRole,
  ) {
    setForm(
      (current) => ({
        ...current,
        role,
        shop_id:
          role === "ADMIN"
            ? null
            : current.shop_id,
      }),
    );
  }


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSaving(true);
    setModalError("");

    try {
      const username =
        form.username.trim();

      if (!username) {
        throw new Error(
          "Username cannot be empty.",
        );
      }

      if (
        !editingUser &&
        !form.password.trim()
      ) {
        throw new Error(
          "Password is required.",
        );
      }

      if (
        form.role === "CASHIER" &&
        form.shop_id === null
      ) {
        throw new Error(
          "Please select a shop for the cashier.",
        );
      }

      if (!editingUser) {
        await createUserApi({
          username,
          password: form.password,
          role: form.role,
          shop_id:
            form.role === "ADMIN"
              ? null
              : form.shop_id,
        });
      } else {
        const updateData: {
          username?: string;
          password?: string;
          role?: string;
          shop_id?: number;
        } = {
          username,
          role: form.role,
        };

        if (form.password.trim()) {
          updateData.password =
            form.password;
        }

        if (
          form.role === "CASHIER" &&
          form.shop_id !== null
        ) {
          updateData.shop_id =
            form.shop_id;
        }

        await updateUserApi(
          editingUser.id,
          updateData,
        );
      }

      closeModal();

      await loadData();

    } catch (err) {
      setModalError(
        err instanceof Error
          ? err.message
          : "Failed to save user.",
      );
    } finally {
      setSaving(false);
    }
  }


  async function handleToggleStatus(
    user: ApiUser,
  ) {
    try {
      setError("");

      await updateUserApi(
        user.id,
        {
          is_active:
            !user.is_active,
        },
      );

      await loadData();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update user status.",
      );
    }
  }


  async function handleDelete(
    user: ApiUser,
  ) {
    const confirmed =
      window.confirm(
        `Delete the account "${user.username}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteUserApi(
        user.id,
      );

      await loadData();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete user.",
      );
    }
  }


  const adminCount =
    users.filter(
      (user) =>
        user.role === "ADMIN",
    ).length;

  const cashierCount =
    users.filter(
      (user) =>
        user.role === "CASHIER",
    ).length;

  const activeCount =
    users.filter(
      (user) =>
        user.is_active,
    ).length;


  return (
    <div className="page-container">

      <div className="page-header">

        <div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
            }}
          >

            <UsersRound
              size={25}
            />

            <h1>
              Users
            </h1>

          </div>

          <p>
            Manage administrator and
            cashier accounts.
          </p>

        </div>


        <div className="page-header-actions">

          <button
            type="button"
            className="primary-button"
            onClick={
              openCreateModal
            }
          >
            <Plus size={17} />

            Add User
          </button>

        </div>

      </div>


      {error && (
        <div
          className="alert alert-error"
          style={{
            marginBottom: "18px",
          }}
        >
          {error}
        </div>
      )}


      <div className="stats-grid">

        <div className="stat-card">

          <div className="stat-icon">
            <UsersRound size={19} />
          </div>

          <div>

            <span className="stat-label">
              Total Users
            </span>

            <strong className="stat-value">
              {users.length}
            </strong>

            <small className="stat-sub">
              All registered accounts
            </small>

          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            <ShieldCheck size={19} />
          </div>

          <div>

            <span className="stat-label">
              Administrators
            </span>

            <strong className="stat-value">
              {adminCount}
            </strong>

            <small className="stat-sub">
              Full system access
            </small>

          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            <UserRound size={19} />
          </div>

          <div>

            <span className="stat-label">
              Cashiers
            </span>

            <strong className="stat-value">
              {cashierCount}
            </strong>

            <small className="stat-sub">
              Shop-assigned accounts
            </small>

          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            <ShieldCheck size={19} />
          </div>

          <div>

            <span className="stat-label">
              Active Accounts
            </span>

            <strong className="stat-value">
              {activeCount}
            </strong>

            <small className="stat-sub">
              Currently enabled
            </small>

          </div>

        </div>

      </div>


      <div
        className="dashboard-panel"
        style={{
          marginTop: "18px",
        }}
      >

        <div className="dashboard-panel-header">

          <div>

            <h2>
              Account Directory
            </h2>

            <p>
              Manage access to your
              SnackFlow workspace.
            </p>

          </div>

        </div>


        {loading ? (
          <div className="dashboard-empty">

            <UsersRound
              size={28}
            />

            <p>
              Loading users...
            </p>

          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">

            <UsersRound
              size={32}
            />

            <h3>
              No users found
            </h3>

            <p>
              Create the first SnackFlow
              account to get started.
            </p>

          </div>
        ) : (
          <div className="table-responsive">

            <table>

              <thead>

                <tr>

                  <th>
                    User
                  </th>

                  <th>
                    Role
                  </th>

                  <th>
                    Assigned Shop
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {users.map(
                  (user) => (
                    <tr
                      key={user.id}
                    >

                      <td>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >

                          <div className="stat-icon">

                            {user.role ===
                            "ADMIN" ? (
                              <ShieldCheck
                                size={17}
                              />
                            ) : (
                              <UserRound
                                size={17}
                              />
                            )}

                          </div>

                          <div>

                            <strong>
                              {user.username}
                            </strong>

                            <div
                              className="text-muted"
                              style={{
                                fontSize:
                                  "11px",
                                marginTop:
                                  "3px",
                              }}
                            >
                              User #{user.id}
                            </div>

                          </div>

                        </div>

                      </td>


                      <td>

                        <span
                          className={
                            `status-badge ${
                              user.role ===
                              "ADMIN"
                                ? "status-success"
                                : "status-open"
                            }`
                          }
                        >
                          {user.role}
                        </span>

                      </td>


                      <td>

                        {user.role ===
                        "ADMIN"
                          ? "All Shops"
                          : user.shop_name ??
                            "Unassigned"}

                      </td>


                      <td>

                        <button
                          type="button"
                          className={
                            `status-badge ${
                              user.is_active
                                ? "status-active"
                                : "status-inactive"
                            }`
                          }
                          onClick={() =>
                            handleToggleStatus(
                              user,
                            )
                          }
                          title={
                            user.is_active
                              ? "Deactivate account"
                              : "Activate account"
                          }
                        >
                          {user.is_active
                            ? "Active"
                            : "Inactive"}
                        </button>

                      </td>


                      <td>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >

                          <button
                            type="button"
                            className="icon-button"
                            onClick={() =>
                              openEditModal(
                                user,
                              )
                            }
                            title="Edit user"
                            aria-label="Edit user"
                          >
                            <Pencil
                              size={16}
                            />
                          </button>


                          <button
                            type="button"
                            className="icon-button"
                            onClick={() =>
                              handleDelete(
                                user,
                              )
                            }
                            title="Delete user"
                            aria-label="Delete user"
                          >
                            <Trash2
                              size={16}
                            />
                          </button>

                        </div>

                      </td>

                    </tr>
                  ),
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>


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
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-modal-title"
          >

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent:
                  "space-between",
                gap: "15px",
                marginBottom: "22px",
              }}
            >

              <div>

                <h2
                  id="user-modal-title"
                >
                  {editingUser
                    ? "Edit User"
                    : "Create User"}
                </h2>

                <p
                  className="text-secondary"
                  style={{
                    margin:
                      "5px 0 0",
                    fontSize: "13px",
                  }}
                >
                  {editingUser
                    ? "Update this account's access and shop assignment."
                    : "Create an account for a SnackFlow administrator or cashier."}
                </p>

              </div>


              <button
                type="button"
                className="icon-button"
                onClick={
                  closeModal
                }
                disabled={saving}
                aria-label="Close"
              >
                <X size={18} />
              </button>

            </div>


            {modalError && (
              <div
                className="alert alert-error"
                style={{
                  marginBottom: "18px",
                }}
              >
                {modalError}
              </div>
            )}


            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="form-field">

                <label
                  htmlFor="user-username"
                >
                  Username
                </label>

                <input
                  id="user-username"
                  type="text"
                  value={
                    form.username
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        username:
                          event.target
                            .value,
                      }),
                    )
                  }
                  placeholder="Enter username"
                  autoComplete="username"
                  disabled={saving}
                  required
                />

              </div>


              <div className="form-field">

                <label
                  htmlFor="user-password"
                >
                  {editingUser
                    ? "New Password"
                    : "Password"}
                </label>

                <input
                  id="user-password"
                  type="password"
                  value={
                    form.password
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        password:
                          event.target
                            .value,
                      }),
                    )
                  }
                  placeholder={
                    editingUser
                      ? "Leave blank to keep current password"
                      : "Create a password"
                  }
                  autoComplete="new-password"
                  disabled={saving}
                  required={
                    !editingUser
                  }
                />

                {editingUser && (
                  <small>
                    Leave blank if the
                    password should remain
                    unchanged.
                  </small>
                )}

              </div>


              <div className="form-field">

                <label
                  htmlFor="user-role"
                >
                  Role
                </label>

                <select
                  id="user-role"
                  value={
                    form.role
                  }
                  onChange={(event) =>
                    handleRoleChange(
                      event.target
                        .value as UserRole,
                    )
                  }
                  disabled={saving}
                >

                  <option value="CASHIER">
                    CASHIER
                  </option>

                  <option value="ADMIN">
                    ADMIN
                  </option>

                </select>

              </div>


              {form.role ===
                "CASHIER" && (
                <div className="form-field">

                  <label
                    htmlFor="user-shop"
                  >
                    Assigned Shop
                  </label>

                  <select
                    id="user-shop"
                    value={
                      form.shop_id ??
                      ""
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          shop_id:
                            event.target
                              .value
                              ? Number(
                                  event.target
                                    .value,
                                )
                              : null,
                        }),
                      )
                    }
                    disabled={saving}
                    required
                  >

                    <option value="">
                      Select a shop
                    </option>

                    {shops.map(
                      (shop) => (
                        <option
                          key={
                            shop.id
                          }
                          value={
                            shop.id
                          }
                        >
                          {shop.name}
                        </option>
                      ),
                    )}

                  </select>

                  <small>
                    Cashiers can only access
                    data belonging to their
                    assigned shop.
                  </small>

                </div>
              )}


              {form.role ===
                "ADMIN" && (
                <div
                  className="alert alert-info"
                  style={{
                    marginBottom: "16px",
                  }}
                >
                  Administrators have
                  access to all shops and
                  user management.
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
                  onClick={
                    closeModal
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
                  {saving
                    ? "Saving..."
                    : editingUser
                      ? "Save Changes"
                      : "Create User"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}


export default Users;