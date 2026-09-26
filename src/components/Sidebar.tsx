import {
  BarChart3,
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingCart,
  Store,
  UserCog,
  Users,
} from "lucide-react";

import {
  NavLink,
} from "react-router-dom";


interface StoredUser {
  username: string;
  role: string;
  shop_id: number | null;
}


function getStoredUser(): StoredUser | null {
  try {
    const raw =
      localStorage.getItem(
        "snackflow_user",
      );

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch {
    return null;
  }
}


const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    label: "Shops",
    icon: Store,
    path: "/shops",
  },
  {
    label: "POS",
    icon: ShoppingCart,
    path: "/pos",
  },
  {
    label: "Products",
    icon: Package,
    path: "/products",
  },
  {
    label: "Orders",
    icon: Receipt,
    path: "/orders",
  },
  {
    label: "Workers",
    icon: Users,
    path: "/workers",
  },
  {
    label: "Analytics",
    icon: BarChart3,
    path: "/analytics",
  },
];


function Sidebar() {
  const user =
    getStoredUser();

  const isAdmin =
    user?.role === "ADMIN";


  const visibleMenuItems =
    isAdmin
      ? [
          ...menuItems,
          {
            label: "Users",
            icon: UserCog,
            path: "/users",
          },
        ]
      : menuItems;


  return (
    <aside className="sidebar">

      {/* BRAND */}

      <div className="sidebar-brand">

        <div className="sidebar-brand-mark">
          SF
        </div>

        <div>
          <h2>
            SnackFlow
          </h2>

          <span>
            Shop management
          </span>
        </div>

      </div>


      {/* NAVIGATION */}

      <nav className="sidebar-nav">

        <p className="sidebar-section-title">
          MANAGEMENT
        </p>

        {visibleMenuItems.map(
          (item) => {
            const Icon =
              item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({
                  isActive,
                }) =>
                  isActive
                    ? "sidebar-link active"
                    : "sidebar-link"
                }
              >

                <Icon
                  size={19}
                  strokeWidth={1.9}
                />

                <span>
                  {item.label}
                </span>

              </NavLink>
            );
          },
        )}

      </nav>


      {/* SIDEBAR FOOTER */}

      <div className="sidebar-footer">

        <div className="sidebar-footer-card">

          <span className="sidebar-status-dot" />

          <div>

            <strong>
              System Online
            </strong>

            <span>
              SnackFlow is running
            </span>

          </div>

        </div>

      </div>

    </aside>
  );
}


export default Sidebar;