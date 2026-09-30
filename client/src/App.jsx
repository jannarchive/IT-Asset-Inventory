import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "./App.css";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAssetsOverview from "./pages/AdminAssetsOverview";
import AdminAddAssetRecord from "./pages/AdminAddAssetRecord";
import AdminReports from "./pages/AdminReports";

const NotFound = () => <h1>404 - Not Found</h1>;

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Login />,
      errorElement: <NotFound />,
    },
    {
      path: "/admin/dashboard",
      element: <AdminDashboard />,
      errorElement: <NotFound />,
    },
    {
      path: "/admin/assets",
      element: <AdminAssetsOverview />,
      errorElement: <NotFound />,
    },
    {
      path: "/admin/assets/new",
      element: <AdminAddAssetRecord />,
      errorElement: <NotFound />,
    },
      {
      path: "/admin/reports",
      element: <AdminReports />,
      errorElement: <NotFound />,
    },
  ]);

function App() {

  return <RouterProvider router={router} />;
}

export default App;