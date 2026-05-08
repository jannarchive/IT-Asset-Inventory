import { useState } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";

import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const notFound = () => <h1>404 - Not Found</h1>;

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Login setIsLoggedIn={setIsLoggedIn} />,
      errorElement: <notFound />,
    },
    {
      path: "/admin-dashboard",
      element: <AdminDashboard />,
      errorElement: <notFound />,
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
