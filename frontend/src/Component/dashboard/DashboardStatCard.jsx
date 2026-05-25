import React from "react";

const DashboardStatCard = ({
  title,
  value,
  icon: Icon,
  iconBg = "bg-gray-100",
  iconColor = "text-gray-600",
  trend,
  description,
  loading,
}) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all">
    <div className="mb-4 flex items-center justify-between">
      <div className={`${iconBg} p-3 rounded-lg`}>
        {Icon && <Icon className={`w-6 h-6 ${iconColor}`} />}
      </div>
      {trend ? <span className="text-xs text-gray-500">{trend}</span> : null}
    </div>

    {loading ? (
      <div className="space-y-2">
        <div className="h-8 w-20 rounded bg-gray-200 animate-pulse" />
        <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
      </div>
    ) : (
      <>
        <h3 className="mb-1 text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm text-gray-600">{title}</p>
      </>
    )}

    {description && !loading && (
      <p className="mt-3 text-xs text-gray-500">{description}</p>
    )}
  </div>
);

export default DashboardStatCard;
