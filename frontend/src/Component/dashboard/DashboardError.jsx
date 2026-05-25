import React from "react";
import { AlertCircle } from "lucide-react";

const DashboardError = ({
  error,
  onRetry,
  title = "Failed to load dashboard",
  message = "Unable to load dashboard data",
  buttonText = "Try Again",
}) => (
  <div className="min-h-screen bg-gray-50 p-6">
    <div className="mx-auto max-w-4xl rounded-xl border border-red-200 bg-white p-8 shadow-sm text-center">
      <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
      <h2 className="mb-2 text-2xl font-bold text-gray-900">{title}</h2>
      <p className="mb-6 text-gray-600">{error?.message || message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg bg-[#0f5841] px-6 py-2 text-white transition hover:bg-[#0a4030]"
        >
          {buttonText}
        </button>
      )}
    </div>
  </div>
);

export default DashboardError;
