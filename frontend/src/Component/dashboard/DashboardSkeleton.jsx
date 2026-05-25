import React from "react";

const DashboardSkeleton = ({ showBanner = true }) => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {showBanner && (
        <div className="rounded-3xl bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] p-6 lg:p-8 text-white shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="h-8 w-64 rounded bg-white/20 animate-pulse" />
              <div className="flex flex-wrap gap-4">
                <div className="h-4 w-32 rounded bg-white/20 animate-pulse" />
                <div className="h-4 w-32 rounded bg-white/20 animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-white/20 animate-pulse" />
              <div className="space-y-3">
                <div className="h-4 w-28 rounded bg-white/20 animate-pulse" />
                <div className="h-8 w-40 rounded bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="h-12 w-12 rounded-lg bg-gray-200 animate-pulse" />
              <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
            </div>
            <div className="h-8 w-16 rounded bg-gray-200 animate-pulse mb-3" />
            <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
          >
            <div className="h-6 w-40 rounded bg-gray-200 animate-pulse mb-6" />
            <div className="h-64 rounded bg-gray-100 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default DashboardSkeleton;
