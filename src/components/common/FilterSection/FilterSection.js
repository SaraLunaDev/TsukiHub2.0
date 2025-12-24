import React from "react";
import "./FilterSection.css";
import { MdiChevronDown } from "../../icons/MdiChevronDown";
import { MdiChevronUp } from "../../icons/MdiChevronUp";

export default function FilterSection({
  label,
  open,
  onClick,
  children,
  divProps = {},
}) {
  return (
    <>
      <span className="filter-section-toggle" onClick={onClick}>
        {label}
        {open ? (
          <MdiChevronUp style={{ marginLeft: 4 }} />
        ) : (
          <MdiChevronDown style={{ marginLeft: 4 }} />
        )}
      </span>
      {open && <div {...divProps}>{children}</div>}
    </>
  );
}
