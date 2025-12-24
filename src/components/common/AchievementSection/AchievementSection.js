import React from "react";
import { SolarCupBold } from "../../icons/SolarCupBold";
import { MdiChevronUp } from "../../icons/MdiChevronUp";
import { MdiChevronDown } from "../../icons/MdiChevronDown";
import "./AchievementSection.css";

export default function AchievementSection({
  details,
  users,
  expanded,
  maxUsers,
  onToggle,
}) {
  return (
    <div
      className={`achievement-section${expanded ? " show-desc" : ""}`}
      data-achievement-key={details.key}
    >
      <h3
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "default",
          justifyContent: "space-between",
          width: "100%",
        }}
        aria-describedby={`desc-${details.key}`}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              display: "inline-block",
              width: 16,
              height: 16,
              flexShrink: 0,
              verticalAlign: "text-bottom",
            }}
          >
            <SolarCupBold
              width={16}
              height={16}
              color={details.color}
              style={{
                color: details.color,
                width: 16,
                height: 16,
                verticalAlign: "text-bottom",
                display: "block",
              }}
            />
          </span>
          <span
            style={{
              minHeight: 24,
              display: "flex",
              alignItems: "center",
            }}
          >
            {details.name}
          </span>
        </span>
        <button
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 2,
            marginLeft: 8,
            display: "flex",
            alignItems: "center",
          }}
          onClick={onToggle}
        >
          {expanded ? (
            <MdiChevronUp width={20} height={20} style={{ color: "var(--text)" }} />
          ) : (
            <MdiChevronDown width={20} height={20} style={{ color: "var(--text)" }} />
          )}
        </button>
      </h3>
      {expanded && (
        <>
          <span
            id={`desc-${details.key}`}
            className="achievement-desc-inline"
            style={{ maxWidth: "100%" }}
          >
            {details.description}
          </span>
          <div
            className={`achievement-users-list${users.length > 0 ? " has-users" : ""}`}
          >
            {users.map((user, index) => (
              <img
                key={user.id || index}
                src={user.pfp}
                alt={user.nombre}
                className="achievement-user-avatar"
                title={user.nombre}
              />
            ))}
          </div>
        </>
      )}
      {!expanded && (
        <div className="achievement-users">
          {users.length > maxUsers
            ? users
                .slice(0, maxUsers - 1)
                .map((user, index) => (
                  <img
                    key={user.id || index}
                    src={user.pfp}
                    alt={user.nombre}
                    className="achievement-user-avatar"
                    title={user.nombre}
                  />
                ))
            : users.map((user, index) => (
                <img
                  key={user.id || index}
                  src={user.pfp}
                  alt={user.nombre}
                  className="achievement-user-avatar"
                  title={user.nombre}
                />
              ))}
          {users.length > maxUsers && (
            <span className="more-users">+{users.length - (maxUsers - 1)}</span>
          )}
        </div>
      )}
    </div>
  );
}
