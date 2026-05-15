import { useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

import './App.css';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const NotFound = () => <h1>404 - Not Found</h1>;

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Login />,
      errorElement: <NotFound />,
    },
    {
      path: "/admin-dashboard",
      element: <AdminDashboard />,
      errorElement: <NotFound />,
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;