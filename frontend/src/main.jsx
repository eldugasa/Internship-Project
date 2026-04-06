import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { AuthProvider } from './context/AuthContext';
import { RouterProvider } from 'react-router-dom';
import { router } from './App';
import { queryClient } from './services/apiClient';

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
     <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
