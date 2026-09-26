import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Analytics from "./pages/Analytics/Analytics";
import Dashboard from "./pages/Dashboard/Dashboard";
import Login from "./pages/Login/Login";
import Orders from "./pages/Orders/Orders";
import POS from "./pages/POS/POS";
import Products from "./pages/Products/Products";
import Shops from "./pages/Shops/Shops";
import Users from "./pages/Users/Users";
import Workers from "./pages/Workers/Workers";


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


function ProtectedRoutes() {
  const isLoggedIn =
    localStorage.getItem(
      "snackflow_logged_in",
    ) === "true";


  if (!isLoggedIn) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  const user =
    getStoredUser();

  const isAdmin =
    user?.role === "ADMIN";


  return (
    <MainLayout>

      <Routes>

        <Route
          path="/dashboard"
          element={
            <Dashboard />
          }
        />

        <Route
          path="/shops"
          element={
            <Shops />
          }
        />

        <Route
          path="/pos"
          element={
            <POS />
          }
        />

        <Route
          path="/products"
          element={
            <Products />
          }
        />

        <Route
          path="/orders"
          element={
            <Orders />
          }
        />

        <Route
          path="/workers"
          element={
            <Workers />
          }
        />

        <Route
          path="/analytics"
          element={
            <Analytics />
          }
        />


        {isAdmin && (
          <Route
            path="/users"
            element={
              <Users />
            }
          />
        )}


        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>

    </MainLayout>
  );
}


function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/login"
          element={
            <Login />
          }
        />

        <Route
          path="*"
          element={
            <ProtectedRoutes />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}


export default App;