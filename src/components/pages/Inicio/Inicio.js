import React, { useState, useMemo, useRef, useEffect } from "react";
import { useGoogleSheet } from "../../../hooks/useGoogleSheet";

import { SolarCupBold } from "../../icons/SolarCupBold";
import { MdiChevronUp } from "../../icons/MdiChevronUp";
import { MdiChevronDown } from "../../icons/MdiChevronDown";
import { MaterialSymbolsAndroidMessages } from "../../icons/MaterialSymbolsAndroidMessages";
import { IonTicket } from "../../icons/IonTicket";

import SearchBar from "../../common/SearchBar";
import "./Inicio.css";

const EXCLUDED_USERS = ["TsukiSoft", "TsukiwiChan"];

function Inicio() {
  const [expandedEmotesRow, setExpandedEmotesRow] = useState(null);
  const [expandedAchievements, setExpandedAchievements] = useState([]);
  const achievementsGridRef = useRef(null);
  const [maxUsersMap, setMaxUsersMap] = useState({});
  const sheetUrl = process.env.REACT_APP_USERDATA_SHEET_URL;
  const {
    data: rawData,
    loading,
    error,
  } = useGoogleSheet(sheetUrl, "userData");

  const achievements = useMemo(() => {
    if (!rawData || !rawData.length) return {};
    const headers = Object.keys(rawData[0] || {});
    const achievementHeaders = headers.filter((header) =>
      header.startsWith("l_")
    );
    const achievementUsers = {};
    achievementHeaders.forEach((achievement) => {
      achievementUsers[achievement] = rawData.filter(
        (user) =>
          user[achievement]?.toString().toLowerCase() === "si" &&
          user.nombre &&
          !EXCLUDED_USERS.includes(String(user.nombre))
      );
    });
    return achievementUsers;
  }, [rawData]);

  useEffect(() => {
    const grid = achievementsGridRef.current;
    if (!grid) return;
    const updateMaxUsers = () => {
      const sections = grid.querySelectorAll(".achievement-section");
      const newMap = {};
      sections.forEach((section) => {
        const usersRow = section.querySelector(".achievement-users");
        if (!usersRow) return;
        const avatarWidth = 27;
        const moreWidth = 38;
        const available = usersRow.offsetWidth - 8;
        const max = Math.max(
          2,
          Math.floor((available - moreWidth) / avatarWidth) + 1
        );
        const key = section.getAttribute("data-achievement-key");
        if (key) newMap[key] = max;
      });
      setMaxUsersMap(newMap);
    };
    updateMaxUsers();
    window.addEventListener("resize", updateMaxUsers);
    const observer = new window.ResizeObserver(updateMaxUsers);
    observer.observe(grid);
    return () => {
      window.removeEventListener("resize", updateMaxUsers);
      observer.disconnect();
    };
  }, [achievements]);

  const [searchFilters, setSearchFilters] = useState({
    racha: "",
    mensajes: "",
    tickets: "",
    emotes: "",
  });

  const achievementDetails = {
    l_racha: {
      name: "Vigia Centenario",
      description: "Escribir un mensaje durante 100 directos consecutivos",
      color: "#FFD700",
    },
    l_mensajes: {
      name: "Eminencia Mensajera",
      description: "Llegar a los 10 mil mensajes enviados",
      color: "#FFD700",
    },
    l_pokedex: {
      name: "Apice de Kanto",
      description: "Consigue capturar todos los Pokemons de la region de Kanto",
      color: "#C0C0C0",
    },
    l_eevees: {
      name: "Leyenda Evolutiva",
      description: "Consigue capturar todos los eevees disponibles",
      color: "#C0C0C0",
    },
    l_gacha: {
      name: "La Tengu Implacable",
      description: "Consigue a Sara del banner Genshin en el Gacha",
      color: "#cd7f32",
    },
  };

  const userData = useMemo(() => {
    if (!rawData || !rawData.length) return [];
    return rawData
      .filter(
        (user) => user.nombre && !EXCLUDED_USERS.includes(String(user.nombre))
      )
      .map((user) => ({
        ...user,
        tickets: typeof user.tickets === "number" ? user.tickets : 0,
        emotes: user.emotes
          ? typeof user.emotes === "string"
            ? user.emotes.split(" ").filter((e) => e)
            : []
          : [],
      }));
  }, [rawData]);

  if (loading && (!rawData || rawData.length === 0)) {
    return (
      <div className="inicio-container">
        <p>Cargando estadisticas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="inicio-container">
        <p>Error: {error}</p>
      </div>
    );
  }

  const getTopUsers = (field, limit = 10, searchTerm = "") => {
    return userData
      .filter((user) => {
        if (field === "emotes") {
          return Array.isArray(user[field]) && user[field].length > 0;
        }
        return user[field] != null && user[field] !== "";
      })
      .filter(
        (user) =>
          searchTerm === "" ||
          String(user.nombre || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (field === "racha") {
          const aStr = String(a[field]);
          const bStr = String(b[field]);

          const aNum =
            aStr.startsWith("m_") || aStr.startsWith("f_")
              ? parseInt(aStr.slice(2), 10)
              : parseInt(aStr, 10);
          const bNum =
            bStr.startsWith("m_") || bStr.startsWith("f_")
              ? parseInt(bStr.slice(2), 10)
              : parseInt(bStr, 10);

          return (isNaN(bNum) ? 0 : bNum) - (isNaN(aNum) ? 0 : aNum);
        } else if (field === "emotes") {
          const aEmotes = Array.isArray(a[field]) ? a[field].length : 0;
          const bEmotes = Array.isArray(b[field]) ? b[field].length : 0;
          return bEmotes - aEmotes;
        }

        const aNum =
          typeof a[field] === "number" ? a[field] : parseFloat(a[field]) || 0;
        const bNum =
          typeof b[field] === "number" ? b[field] : parseFloat(b[field]) || 0;

        return bNum - aNum;
      })
      .slice(0, limit);
  };

  return (
    <div className="main-container">
      <div className="top-section">
        <h2
          className="user-info-header"
          style={{
            margin: "0 0 6px 0",
            fontSize: "1.2em",
            color: "var(--text)",
          }}
        >
          Tablas de Datos
        </h2>
        <div
          className="user-count-info"
          style={{
            fontWeight: 500,
            color: "var(--text-2)",
          }}
        >
          <b>{userData.length}</b> usuario{userData.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="stats-grid inset-section">
        <div className="stat-section">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2
              style={{
                margin: 0,
                marginBottom: 16,
                fontSize: "1.1em",
                color: "var(--text)",
                fontWeight: 600,
              }}
            >
              Rachas
            </h2>
            <span
              style={{
                fontSize: "0.88em",
                color: "var(--text-2)",
                fontWeight: 500,
                marginBottom: 16,
              }}
            >
              {
                userData.filter((user) => {
                  const rachaStr = String(user.racha || "");
                  const rachaNum =
                    rachaStr.startsWith("m_") || rachaStr.startsWith("f_")
                      ? parseInt(rachaStr.slice(2), 10)
                      : parseInt(rachaStr, 10);
                  return !isNaN(rachaNum) && rachaNum >= 5;
                }).length
              }{" "}
              activas
            </span>
          </div>
          <SearchBar
            placeholder="Buscar usuario..."
            value={searchFilters.racha}
            onChange={(value) =>
              setSearchFilters((prev) => ({ ...prev, racha: value }))
            }
          />
          <div className="table-container">
            <table>
              <tbody>
                {getTopUsers("racha", 10, searchFilters.racha).map(
                  (user, index) => {
                    const rachaStr = String(user.racha || "");
                    const isRed = rachaStr.startsWith("m_");
                    const isBlue = rachaStr.startsWith("f_");
                    const rachaValue = rachaStr.replace(/^[mf]_/, "") || "0";

                    return (
                      <tr key={user.id || index}>
                        <td>
                          <img
                            src={user.pfp}
                            alt={user.nombre}
                            className="profile-pic"
                          />
                        </td>
                        <td>{user.nombre}</td>
                        <td
                          style={{
                            color:
                              !isRed && !isBlue
                                ? "var(--text-2)"
                                : isRed
                                ? "rgba(128, 41, 26, 1)"
                                : "rgba(26, 104, 128, 1)",
                          }}
                        >
                          <span style={{ marginRight: "8px" }}>
                            {rachaValue}
                          </span>
                          <span
                            style={{
                              display: "inline-block",
                              width: 16,
                              height: 16,
                              verticalAlign: "text-bottom",
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              width="1em"
                              height="1em"
                              style={{
                                verticalAlign: "baseline",
                                color:
                                  !isRed && !isBlue
                                    ? "var(--text-2)"
                                    : isRed
                                    ? "rgba(128, 41, 26, 1)"
                                    : "rgba(26, 104, 128, 1)",
                              }}
                            >
                              <path
                                fill="currentColor"
                                d="M12.832 21.801c3.126-.626 7.168-2.875 7.168-8.69c0-5.291-3.873-8.815-6.658-10.434c-.619-.36-1.342.113-1.342.828v1.828c0 1.442-.606 4.074-2.29 5.169c-.86.559-1.79-.278-1.894-1.298l-.086-.838c-.1-.974-1.092-1.565-1.87-.971C4.461 8.46 3 10.33 3 13.11C3 20.221 8.289 22 10.933 22q.232 0 .484-.015C10.111 21.874 8 21.064 8 18.444c0-2.05 1.495-3.435 2.631-4.11c.306-.18.663.055.663.41v.59c0 .45.175 1.155.59 1.637c.47.546 1.159-.026 1.214-.744c.018-.226.246-.37.442-.256c.641.375 1.46 1.175 1.46 2.473c0 2.048-1.129 2.99-2.168 3.357"
                              />
                            </svg>
                          </span>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="stat-section">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2
              style={{
                margin: 0,
                marginBottom: 16,
                fontSize: "1.1em",
                color: "var(--text)",
                fontWeight: 600,
              }}
            >
              Mensajes
            </h2>
            <span
              style={{
                fontSize: "0.88em",
                color: "var(--text-2)",
                fontWeight: 500,
                marginBottom: 16,
              }}
            >
              {(() => {
                const total = userData.reduce(
                  (acc, user) => acc + (parseInt(user.mensajes, 10) || 0),
                  0
                );
                return `${total} mensajes`;
              })()}
            </span>
          </div>
          <SearchBar
            placeholder="Buscar usuario..."
            value={searchFilters.mensajes}
            onChange={(value) =>
              setSearchFilters((prev) => ({ ...prev, mensajes: value }))
            }
          />
          <div className="table-container">
            <table>
              <tbody>
                {getTopUsers("mensajes", 10, searchFilters.mensajes).map(
                  (user, index) => (
                    <tr key={user.id || index}>
                      <td>
                        <img
                          src={user.pfp}
                          alt={user.nombre}
                          className="profile-pic"
                        />
                      </td>
                      <td>{user.nombre}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <span style={{ marginRight: "8px" }}>
                          {user.mensajes}
                        </span>
                        <span
                          style={{
                            display: "inline-block",
                            width: 16,
                            height: 16,
                            verticalAlign: "text-bottom",
                          }}
                        >
                          <MaterialSymbolsAndroidMessages
                            style={{
                              verticalAlign: "baseline",
                              color: "var(--text-2)",
                            }}
                            width="14"
                            height="14"
                          />
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="stat-section">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2
              style={{
                margin: 0,
                marginBottom: 16,
                fontSize: "1.1em",
                color: "var(--text)",
                fontWeight: 600,
              }}
            >
              Tickets
            </h2>
            <span
              style={{
                fontSize: "0.88em",
                color: "var(--text-2)",
                fontWeight: 500,
                marginBottom: 16,
              }}
            >
              {(() => {
                const total = userData.reduce(
                  (acc, user) => acc + (parseInt(user.tickets, 10) || 0),
                  0
                );
                return `${total} tickets`;
              })()}
            </span>
          </div>
          <SearchBar
            placeholder="Buscar usuario..."
            value={searchFilters.tickets}
            onChange={(value) =>
              setSearchFilters((prev) => ({ ...prev, tickets: value }))
            }
          />
          <div className="table-container">
            <table>
              <tbody>
                {getTopUsers("tickets", 10, searchFilters.tickets).map(
                  (user, index) => (
                    <tr key={user.id || index}>
                      <td>
                        <img
                          src={user.pfp}
                          alt={user.nombre}
                          className="profile-pic"
                        />
                      </td>
                      <td>{user.nombre}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <span style={{ marginRight: "8px" }}>
                          {user.tickets}
                        </span>
                        <span
                          style={{
                            display: "inline-block",
                            width: 16,
                            height: 16,
                            verticalAlign: "text-bottom",
                          }}
                        >
                          <IonTicket
                            style={{
                              verticalAlign: "baseline",
                              color: "var(--text-2)",
                            }}
                            width="14"
                            height="14"
                          />
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="stat-section emotes-section">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2
              style={{
                margin: 0,
                marginBottom: 16,
                fontSize: "1.1em",
                color: "var(--text)",
                fontWeight: 600,
              }}
            >
              Emotes
            </h2>
            <span
              style={{
                fontSize: "0.88em",
                color: "var(--text-2)",
                fontWeight: 500,
                marginBottom: 16,
              }}
            >
              {(() => {
                const total = userData.reduce(
                  (acc, user) =>
                    acc + (Array.isArray(user.emotes) ? user.emotes.length : 0),
                  0
                );
                return `${total} emotes`;
              })()}
            </span>
          </div>
          <SearchBar
            placeholder="Buscar usuario..."
            value={searchFilters.emotes}
            onChange={(value) =>
              setSearchFilters((prev) => ({ ...prev, emotes: value }))
            }
          />
          <div className="table-container">
            <table>
              <tbody>
                {getTopUsers("emotes", 10, searchFilters.emotes).map(
                  (user, index) => {
                    const maxEmotes = 5;
                    const hasMany =
                      Array.isArray(user.emotes) &&
                      user.emotes.length > maxEmotes;

                    const emotesToShow =
                      expandedEmotesRow === index || !hasMany
                        ? Array.isArray(user.emotes)
                          ? user.emotes
                          : []
                        : Array.isArray(user.emotes)
                        ? user.emotes.slice(0, maxEmotes)
                        : [];
                    const emotesHidden =
                      hasMany && expandedEmotesRow !== index
                        ? user.emotes.length - maxEmotes
                        : 0;
                    return (
                      <tr key={user.id || index}>
                        <td className="user-avatar-cell">
                          <img
                            src={user.pfp}
                            alt={user.nombre}
                            className="profile-pic"
                            title={user.nombre}
                          />
                        </td>
                        <td className="emotes-cell">
                          <div className="emotes-container">
                            {emotesToShow.map((emoteId, emoteIndex) => (
                              <a
                                key={emoteIndex}
                                href={`https://7tv.app/emotes/${emoteId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ display: "inline-block" }}
                              >
                                <img
                                  src={`https://cdn.7tv.app/emote/${emoteId}/1x.webp`}
                                  alt={`Emote ${emoteIndex}`}
                                  className="emote-icon"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                  title={`Emote ${emoteIndex + 1}`}
                                />
                              </a>
                            ))}
                            {emotesHidden > 0 && (
                              <button
                                className="emotes-expand-btn"
                                title="Mostrar todos los emotes"
                                onClick={() => setExpandedEmotesRow(index)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  padding: 0,
                                  marginLeft: "4px",
                                  cursor: "pointer",
                                  verticalAlign: "middle",
                                  display: "inline-flex",
                                }}
                              >
                                <MdiChevronDown
                                  width={22}
                                  height={22}
                                  style={{ color: "var(--text)" }}
                                />
                              </button>
                            )}
                            {expandedEmotesRow === index && hasMany && (
                              <button
                                className="emotes-collapse-btn"
                                title="Ocultar emotes"
                                onClick={() => setExpandedEmotesRow(null)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  padding: 0,
                                  marginLeft: "4px",
                                  cursor: "pointer",
                                  verticalAlign: "middle",
                                  display: "inline-flex",
                                }}
                              >
                                <MdiChevronUp
                                  width={22}
                                  height={22}
                                  style={{ color: "var(--text)" }}
                                />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div
        className="top-section"
        style={{
          marginTop: "20px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div style={{ flex: 1 }}>
          <h2
            className="user-info-header"
            style={{
              margin: "0 0 6px 0",
              fontSize: "1.2em",
              color: "var(--text)",
            }}
          >
            Logros del Directo
          </h2>
          <div
            className="user-count-info"
            style={{
              fontWeight: 500,
              color: "var(--text-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <span>
              <b>
                {
                  userData.filter((user) =>
                    Object.keys(achievements).some((key) =>
                      (achievements[key] || []).some(
                        (u) => u.nombre === user.nombre
                      )
                    )
                  ).length
                }
              </b>{" "}
              usuario
              {userData.filter((user) =>
                Object.keys(achievements).some((key) =>
                  (achievements[key] || []).some(
                    (u) => u.nombre === user.nombre
                  )
                )
              ).length === 1
                ? ""
                : "s"}
            </span>
            {userData.some(
              (user) =>
                user.l_platino &&
                user.l_platino.toString().toLowerCase() === "si"
            ) && (
              <span
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <SolarCupBold
                  width={18}
                  height={18}
                  style={{
                    color: "#ff8888",
                    flexShrink: 0,
                    verticalAlign: "text-bottom",
                  }}
                />
                Platino:
                {userData
                  .filter(
                    (user) =>
                      user.l_platino &&
                      user.l_platino.toString().toLowerCase() === "si"
                  )
                  .map((user, idx) => (
                    <img
                      key={user.id || user.nombre || idx}
                      src={user.pfp}
                      alt={user.nombre}
                      className="achievement-user-avatar"
                      title={user.nombre}
                      style={{ marginLeft: "2px" }}
                    />
                  ))}
              </span>
            )}
          </div>
        </div>
        {/* Botón global eliminado, solo quedan los individuales en cada logro */}
      </div>
      <div
        className="achievements-grid inset-section"
        ref={achievementsGridRef}
      >
        {Object.entries(achievementDetails).map(([key, details]) => {
          const users = achievements[key] || [];
          const maxUsers = maxUsersMap[key] || 7;
          const expanded = expandedAchievements.includes(key);
          return (
            <div
              key={key}
              className={`achievement-section${expanded ? " show-desc" : ""}`}
              data-achievement-key={key}
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
                aria-describedby={`desc-${key}`}
              >
                <span
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
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
                  onClick={() => {
                    setExpandedAchievements((prev) =>
                      expanded ? prev.filter((k) => k !== key) : [...prev, key]
                    );
                  }}
                >
                  {expanded ? (
                    <MdiChevronUp
                      width={20}
                      height={20}
                      style={{ color: "var(--text)" }}
                    />
                  ) : (
                    <MdiChevronDown
                      width={20}
                      height={20}
                      style={{ color: "var(--text)" }}
                    />
                  )}
                </button>
              </h3>
              {expanded && (
                <>
                  <span
                    id={`desc-${key}`}
                    className="achievement-desc-inline"
                    style={{ maxWidth: "100%" }}
                  >
                    {details.description}
                  </span>
                  <div
                    className={`achievement-users-list${
                      users.length > 0 ? " has-users" : ""
                    }`}
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
                    <span className="more-users">
                      +{users.length - (maxUsers - 1)}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Inicio;
