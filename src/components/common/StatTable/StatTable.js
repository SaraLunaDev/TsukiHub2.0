import "./StatTable.css";

export default function StatTable({ rows, columns, rowKey, type }) {
  const renderRow = (row, col, cidx) => {
    if (typeof col.render === "function") {
      return col.render(row, col, cidx);
    }
    if (type === "racha") {
      if (col.key === "racha") {
        const rachaStr = String(row.racha || "");
        const isRed = rachaStr.startsWith("m_");
        const isBlue = rachaStr.startsWith("f_");
        const rachaValue = rachaStr.replace(/^[mf]_/, "") || "0";
        return (
          <span
            style={{
              color:
                !isRed && !isBlue
                  ? "var(--text-2)"
                  : isRed
                  ? "rgba(128, 41, 26, 1)"
                  : "rgba(26, 104, 128, 1)",
            }}
          >
            <span style={{ marginRight: 8 }}>{rachaValue}</span>
            <span
              style={{
                display: "inline-block",
                width: 16,
                height: 16,
                verticalAlign: "text-bottom",
              }}
            >
              {col.icon}
            </span>
          </span>
        );
      }
    }
    if (type === "mensajes") {
      if (col.key === "mensajes") {
        return (
          <span>
            {row.mensajes}
            <span
              style={{
                display: "inline-block",
                width: 16,
                height: 16,
                verticalAlign: "text-bottom",
                marginLeft: 8,
              }}
            >
              {col.icon}
            </span>
          </span>
        );
      }
    }
    if (type === "tickets") {
      if (col.key === "tickets") {
        return (
          <span>
            {row.tickets}
            <span
              style={{
                display: "inline-block",
                width: 16,
                height: 16,
                verticalAlign: "text-bottom",
                marginLeft: 8,
              }}
            >
              {col.icon}
            </span>
          </span>
        );
      }
    }
    if (type === "emotes") {
      if (col.key === "emotes") {
        return (
          <span>
            {Array.isArray(row.emotes) ? row.emotes.length : 0}
            <span
              style={{
                display: "inline-block",
                width: 16,
                height: 16,
                verticalAlign: "text-bottom",
                marginLeft: 8,
              }}
            >
              {col.icon}
            </span>
          </span>
        );
      }
    }
    return row[col.key];
  };

  return (
    <div className="stat-table-container">
      <table className="stat-table">
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row[rowKey] || idx}>
              {columns.map((col, cidx) => (
                <td key={cidx} className={col.className || ""}>
                  {renderRow(row, col, cidx)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
