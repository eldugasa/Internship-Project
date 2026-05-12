import React from "react";
import { Link } from "react-router-dom";

const WorkspacePanel = ({
  title,
  description,
  accentBg,
  accentBorder,
  primaryLabel,
  primaryTo,
  primaryClassName,
  secondaryLabel,
  secondaryTo,
  secondaryClassName,
}) => (
  <section className={`rounded-2xl border p-5 ${accentBorder} ${accentBg}`}>
    <h2 className="text-xl font-bold text-slate-900">{title}</h2>
    <p className="mt-2 text-sm text-slate-600">{description}</p>
    <div className="mt-4 flex flex-wrap gap-3">
      <Link to={primaryTo} className={primaryClassName}>
        {primaryLabel}
      </Link>
      <Link to={secondaryTo} className={secondaryClassName}>
        {secondaryLabel}
      </Link>
    </div>
  </section>
);

export default WorkspacePanel;
