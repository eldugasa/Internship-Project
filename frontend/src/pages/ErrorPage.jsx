// src/pages/ErrorPage.jsx
import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, RefreshCw, Home, Shield, Lock, WifiOff } from 'lucide-react';

export default function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = "Oops! Something went wrong";
  let message = "An unexpected error occurred. Please try again later.";
  let icon = <AlertCircle className="w-12 h-12 text-red-600" />;
  let buttonText = "Try Again";
  let buttonAction = () => window.location.reload();

  if (isRouteErrorResponse(error)) {
    // Handle specific HTTP status codes
    switch (error.status) {
      case 401:
        title = "Unauthorized Access";
        message = "You need to be logged in to view this page.";
        icon = <Lock className="w-12 h-12 text-yellow-600" />;
        buttonText = "Go to Login";
        buttonAction = () => navigate('/login');
        break;
      case 403:
        title = "Access Denied";
        message = "You don't have permission to view this page.";
        icon = <Shield className="w-12 h-12 text-red-600" />;
        buttonText = "Go to Dashboard";
        buttonAction = () => {
          const userStr = localStorage.getItem('user');
          const user = userStr ? JSON.parse(userStr) : null;
          if (user?.role === 'admin') navigate('/admin/dashboard');
          else if (user?.role === 'project-manager') navigate('/manager/dashboard');
          else navigate('/team-member/dashboard');
        };
        break;
      case 404:
        title = "Page Not Found";
        message = "The page you're looking for doesn't exist.";
        icon = <AlertCircle className="w-12 h-12 text-gray-600" />;
        buttonText = "Go Home";
        buttonAction = () => {
          const userStr = localStorage.getItem('user');
          const user = userStr ? JSON.parse(userStr) : null;
          if (user?.role === 'admin') navigate('/admin/dashboard');
          else if (user?.role === 'project-manager') navigate('/manager/dashboard');
          else navigate('/');
        };
        break;
      case 500:
        title = "Server Error";
        message = "Something went wrong on our servers. Please try again later.";
        icon = <AlertCircle className="w-12 h-12 text-red-600" />;
        break;
      case 503:
        title = "Service Unavailable";
        message = "The service is temporarily unavailable. Please check back soon.";
        icon = <WifiOff className="w-12 h-12 text-orange-600" />;
        break;
      default:
        message = error.data?.message || error.statusText || message;
    }
  } else if (error instanceof Error) {
    // Handle JavaScript errors
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      title = "Network Error";
      message = "Unable to connect to the server. Please check your internet connection.";
      icon = <WifiOff className="w-12 h-12 text-orange-600" />;
      buttonText = "Retry";
    } else if (error.message?.includes('loader')) {
      title = "Data Loading Error";
      message = "Failed to load data. Please try again.";
    } else {
      message = error.message;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="bg-red-50 p-4 rounded-full mb-6">
        {icon}
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-600 max-w-md mb-8">{message}</p>
      
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={buttonAction}
          className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition shadow-sm"
        >
          {buttonText === "Try Again" ? <RefreshCw className="w-4 h-4 mr-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
          {buttonText}
        </button>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </button>
      </div>
    </div>
  );
}