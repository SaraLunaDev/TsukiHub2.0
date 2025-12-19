import React, { useState, useEffect, useMemo, useRef } from "react";
import { useGoogleSheet } from "../../../hooks/useGoogleSheet";
import { Icon } from "@iconify/react";
import SearchBar from "../../common/SearchBar";
import "./Inicio.css";

const EXCLUDED_USERS = ["TsukiSoft", "TsukiwiChan"];

function Inicio() {
  const [hoveredEmotesRow, setHoveredEmotesRow] = useState(null);

  const [descKey, setDescKey] = useState(null);

  const [anyAchievementHovered, setAnyAchievementHovered] = useState(false);
  const hoverTimeoutRef = useRef();

  const [achievements, setAchievements] = useState({});

  const achievementsGridRef = useRef(null);
  const [maxUsersMap, setMaxUsersMap] = useState({});

  useEffect(() => {
    function updateMaxUsers() {
      const grid = achievementsGridRef.current;
      if (!grid) return;
      const sections = grid.querySelectorAll(".achievement-section");
      const newMap = {};
      sections.forEach((section, idx) => {
        const usersRow = section.querySelector(".achievement-users");
        if (!usersRow) return;

        const avatarWidth = 27;

        const moreWidth = 38;

        const available = usersRow.offsetWidth - 8;

        const max = Math.max(
          2,
          Math.floor((available - moreWidth) / avatarWidth)
        );

        const key = section.getAttribute("data-achievement-key");
        if (key) newMap[key] = max;
      });
      setMaxUsersMap(newMap);
    }

    setTimeout(updateMaxUsers, 0);
    window.addEventListener("resize", updateMaxUsers);
    return () => window.removeEventListener("resize", updateMaxUsers);
  }, [achievements]);
  const sheetUrl = process.env.REACT_APP_USERDATA_SHEET_URL;
  const {
    data: rawData,
    loading,
    error,
  } = useGoogleSheet(sheetUrl, "userData");

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
    if (!rawData.length) return [];

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

  useEffect(() => {
    if (!rawData.length) return;

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

    setAchievements(achievementUsers);
  }, [rawData]);

  if (loading) {
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
                            <Icon
                              icon="solar:fire-bold"
                              style={{
                                verticalAlign: "baseline",
                                color:
                                  !isRed && !isBlue
                                    ? "var(--text-2)"
                                    : isRed
                                    ? "rgba(128, 41, 26, 1)"
                                    : "rgba(26, 104, 128, 1)",
                              }}
                              width="14"
                              height="14"
                            />
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
                          <Icon
                            icon="material-symbols:android-messages"
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
                          <Icon
                            icon="ion:ticket"
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
                      hoveredEmotesRow === index || !hasMany
                        ? Array.isArray(user.emotes)
                          ? user.emotes
                          : []
                        : Array.isArray(user.emotes)
                        ? user.emotes.slice(0, maxEmotes)
                        : [];
                    const emotesHidden =
                      hasMany && hoveredEmotesRow !== index
                        ? user.emotes.length - maxEmotes
                        : 0;
                    return (
                      <tr
                        key={user.id || index}
                        onMouseEnter={() => setHoveredEmotesRow(index)}
                        onMouseLeave={() => setHoveredEmotesRow(null)}
                      >
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
                              <span className="more-users">
                                +{emotesHidden}
                              </span>
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

      <div className="top-section" style={{ marginTop: "20px" }}>
        <h2
          className="user-info-header"
          style={{
            margin: "0 0 6px 0",
            fontSize: "1.2em",
            color: "var(--text)",
          }}
        >
          Logros del Stream
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
                (achievements[key] || []).some((u) => u.nombre === user.nombre)
              )
            ).length === 1
              ? ""
              : "s"}
          </span>
          {userData.some(
            (user) =>
              user.l_platino && user.l_platino.toString().toLowerCase() === "si"
          ) && (
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Icon
                icon="solar:cup-bold"
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
      <div
        className="achievements-grid inset-section"
        ref={achievementsGridRef}
      >
        {Object.entries(achievementDetails).map(([key, details]) => {
          const users = achievements[key] || [];
          const maxUsers = maxUsersMap[key] || 8;
          return (
            <div
              key={key}
              className={`achievement-section${
                descKey === key ? " show-desc" : ""
              }`}
              data-achievement-key={key}
            >
              <h3
                onMouseEnter={() => setDescKey(key)}
                onMouseLeave={() => setDescKey(null)}
                tabIndex={0}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                aria-describedby={`desc-${key}`}
              >
                <Icon
                  icon="solar:cup-bold"
                  width={16}
                  height={16}
                  color={details.color}
                  style={{
                    color: details.color,
                    flexShrink: 0,
                    verticalAlign: "text-bottom",
                  }}
                />
                {details.name}
              </h3>
              {descKey === key && (
                <span
                  id={`desc-${key}`}
                  className="achievement-desc-inline"
                  style={{ maxWidth: "100%" }}
                >
                  {details.description}
                </span>
              )}
              {descKey !== key && (
                <div
                  className={`achievement-users${
                    anyAchievementHovered ? " expanded" : ""
                  }`}
                  onMouseEnter={() => {
                    if (hoverTimeoutRef.current) {
                      clearTimeout(hoverTimeoutRef.current);
                      hoverTimeoutRef.current = null;
                    }
                    setAnyAchievementHovered(true);
                  }}
                  onMouseLeave={() => {
                    if (hoverTimeoutRef.current)
                      clearTimeout(hoverTimeoutRef.current);
                    setAnyAchievementHovered(false);
                  }}
                  tabIndex={0}
                  style={{ cursor: "pointer" }}
                  aria-expanded={anyAchievementHovered}
                >
                  {anyAchievementHovered ? (
                    <div className="achievement-users-list">
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
                  ) : (
                    <>
                      {users.slice(0, maxUsers).map((user, index) => (
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
                          +{users.length - maxUsers}
                        </span>
                      )}
                    </>
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
