import {
  Bell,
  LogOut,
  UserCircle,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import Sidebar from "../components/Sidebar";


interface MainLayoutProps {
  children: React.ReactNode;
}


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


function MainLayout({
  children,
}: MainLayoutProps) {
  const navigate =
    useNavigate();

  const user =
    getStoredUser();


  function handleLogout() {
    localStorage.removeItem(
      "snackflow_logged_in",
    );

    localStorage.removeItem(
      "snackflow_token",
    );

    localStorage.removeItem(
      "snackflow_user",
    );

    navigate(
      "/login",
      {
        replace: true,
      },
    );
  }


  const displayRole =
    user?.role === "ADMIN"
      ? "Administrator"
      : "Cashier";


  return (
    <div className="app-shell">

      <Sidebar />


      <div className="main-area">

        {/* TOP HEADER */}

        <header className="top-header">

          <div className="top-header-left">

            <div className="mobile-brand">

              <div className="mobile-brand-mark">
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

          </div>


          <div className="top-header-right">

            {/* Notifications */}

            <button
              type="button"
              className="header-icon-button"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell
                size={18}
              />
            </button>


            <div className="header-divider" />


            {/* Current user */}

            <div className="header-user">

              <div className="header-user-avatar">

                <UserCircle
                  size={20}
                />

              </div>

              <div className="header-user-info">

                <strong>
                  {user?.username ??
                    "User"}
                </strong>

                <span>
                  {displayRole}
                </span>

              </div>

            </div>


            {/* Logout */}

            <button
              type="button"
              className="header-logout-button"
              onClick={
                handleLogout
              }
              title="Logout"
            >

              <LogOut
                size={17}
              />

              <span>
                Logout
              </span>

            </button>

          </div>

        </header>


        {/* PAGE CONTENT */}

        <main className="main-content">
          {children}
        </main>

      </div>

    </div>
  );
}


export default MainLayout;