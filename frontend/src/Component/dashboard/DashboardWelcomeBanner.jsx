import React from "react";
import { Users, Award, TrendingUp } from "lucide-react";

const DashboardWelcomeBanner = ({
  title,
  subtitle,
  metaItems = [],
  summaryTitle,
  summaryValue,
  summarySubtitle,
  accentIcon,
}) => {
  const hasSummary = summaryTitle || summaryValue || summarySubtitle;
  const AccentIcon = accentIcon || TrendingUp;
  const hasMetaItems = Array.isArray(metaItems) && metaItems.length > 0;

  return (
    <div className="bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] rounded-2xl p-6 lg:p-8 text-white shadow-lg">
      <div
        className={`flex flex-col ${hasSummary ? "lg:flex-row lg:items-center justify-between" : ""} gap-6`}
      >
        <div className="min-w-0">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2 truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm lg:text-base opacity-90 text-white/90 mb-4">
              {subtitle}
            </p>
          )}
          {hasMetaItems && (
            <div className="flex flex-wrap gap-4">
              {metaItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm"
                >
                  {item.icon ? (
                    <item.icon className="w-4 h-4 opacity-90" />
                  ) : (
                    <Users className="w-4 h-4 opacity-90" />
                  )}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {hasSummary && (
          <div className="flex items-center gap-4 rounded-3xl bg-white/15 p-5 min-w-[240px]">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <AccentIcon className="w-8 h-8" />
            </div>
            <div>
              <div className="text-sm opacity-80">{summaryTitle}</div>
              <div className="text-3xl font-bold leading-tight">
                {summaryValue}
              </div>
              {summarySubtitle && (
                <div className="text-sm opacity-80 mt-1">{summarySubtitle}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardWelcomeBanner;
