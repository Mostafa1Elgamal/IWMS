import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Orders } from "./pages/Orders";
import { Production } from "./pages/Production";
import { Financial } from "./pages/Financial";
import { PurchaseOrders } from "./pages/PurchaseOrders";
import { Employees } from "./pages/Employees";
import { Suppliers } from "./pages/Suppliers";
import { Attendance } from "./pages/Attendance";
import { Inventory } from "./pages/Inventory";

import InventoryMain from "./INVENTORYY/Inventory/InventoryMain";
import AccountingMain from "./Accounting/AccountingMain";
import SalesMain from "./Sales/SalesMain";
import JobMain from "./JOBS/JobMain";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import { ProtectedRoute } from "./auth/ProtectedRoute";

export const router = createBrowserRouter([
  { path: "/login", Component: Login },
  { path: "/signup", Component: Signup },
  { path: "/", element: <Navigate to="/login" replace /> },

  {
    path: "/Manager",
    element: (
      <ProtectedRoute allowedRoles={["Manager"]}>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: Dashboard },
      { path: "orders", Component: Orders },
      { path: "production", Component: Production },

      { path: "inventory", Component: Inventory },

      { path: "financial", Component: Financial },
      { path: "purchase-orders", Component: PurchaseOrders },
      { path: "employees", Component: Employees },
      { path: "attendance", Component: Attendance },
      { path: "suppliers", Component: Suppliers },
    ],
  },

  {
    path: "/inventory/management/*",
    element: (
      <ProtectedRoute allowedRoles={["Manager", "Inventory"]}>
        <InventoryMain />
      </ProtectedRoute>
    ),
  },
  {
    path: "/Accounting/*",
    element: (
      <ProtectedRoute allowedRoles={["Manager", "Accounting"]}>
        <AccountingMain />
      </ProtectedRoute>
    ),
  },

  {
    path: "/Sales/*",
    element: (
      <ProtectedRoute allowedRoles={["Manager", "Sales Person"]}>
        <SalesMain />
      </ProtectedRoute>
    ),
  },

  {
    path: "/JOBS/*",
    element: (
      <ProtectedRoute allowedRoles={["Manager", "Technician"]}>
        <JobMain />
      </ProtectedRoute>
    ),
  },
]);
