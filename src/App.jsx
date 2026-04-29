import { useState } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";

import Login from "./pages/Login";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const NotFound = () => <h1>404 - Not Found</h1>;

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Login setIsLoggedIn={setIsLoggedIn} />,
      errorElement: <NotFound />,
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
