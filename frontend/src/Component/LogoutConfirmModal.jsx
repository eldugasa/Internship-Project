import React from "react";
import { LogOut } from "lucide-react";
import { createPortal } from "react-dom";

const LogoutConfirmModal = ({
  open,
  onCancel,
  onConfirm,
  title = "Confirm Logout",
  message = "Are you sure you want to logout?",
}) => {
  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <LogOut className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">{title}</h3>
          <p className="mb-6 text-sm text-gray-500">{message}</p>
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default LogoutConfirmModal;
