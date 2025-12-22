import React, { useState, useMemo, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { useGoogleSheet } from "../../../hooks/useGoogleSheet";

import { SolarCupBold } from "../../icons/SolarCupBold";
import { MdiChevronUp } from "../../icons/MdiChevronUp";
import { MdiChevronDown } from "../../icons/MdiChevronDown";
import { MdiChevronDoubleDown } from "../../icons/MdiChevronDoubleDown";
import { MaterialSymbolsAndroidMessages } from "../../icons/MaterialSymbolsAndroidMessages";
import { IonTicket } from "../../icons/IonTicket";
import { SolarFireBold } from "../../icons/SolarFireBold";
import useLocalStorage from "../../../hooks/useLocalStorage";

import SearchBar from "../../common/SearchBar";
import "./Inicio.css";

const EXCLUDED_USERS = ["TsukiSoft", "TsukiwiChan"];

const MOD_USERS = [
  "TsukiSoft",
  "vytoking",
  "Rabam",
  "dollanganger",
  "unai9x",
  "Vilexis98",
  "Samuel_Pincel",
  "el_capde",
  "pubgdemont",
  "AnaPandemonium",
  "Daruz",
  "alvaro_palmer",
  "Emilio2772",
  "enraid1",
  "ShadouShot",
  "oogiebuttie",
  "Lintes96",
  "Donramonrisas",
  "IreNuska__",
  "moon_defaultt",
  "BasedTrolso",
  "NucleoDeJuego",
  "eiosoydev",
  "maese_Javilon",
  "JOSEtomas99",
  "bigmacius",
  "KaranirNoFake",
  "Criis_joestar",
  "Achachancha",
  "TsukiwiChan",
  "JoranEssed",
];

function Inicio() {
  const [twitchUser] = useLocalStorage("twitchUser", null);
  const [expandedEmotesRow, setExpandedEmotesRow] = useState(null);
  const [expandedAchievements, setExpandedAchievements] = useState([]);
  const achievementsGridRef = useRef(null);
  const [maxUsersMap, setMaxUsersMap] = useState({});
  const [showRachaTable, setShowRachaTable] = useState(true);
  const [mensajesView, setMensajesView] = useState(0);
  const [showTicketsTable, setShowTicketsTable] = useState(true);
  const [showEmotesTable, setShowEmotesTable] = useState(true);
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

  const isMod =
    twitchUser &&
    MOD_USERS.map((u) => u.toLowerCase()).includes(
      (twitchUser.login || twitchUser.displayName || "").toLowerCase()
    );

  return (
    <div className="main-container">
      <div className="top-section">
        <h2>Tablas de Datos</h2>
        <div className="top-section-h2-down">
          <span>
            <b>{userData.length}</b> usuario{userData.length === 1 ? "" : "s"}
          </span>
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
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              <button
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  marginRight: 6,
                  marginBottom: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                onClick={() => setShowRachaTable((prev) => !prev)}
                aria-label={
                  showRachaTable
                    ? "Ocultar tabla Rachas"
                    : "Mostrar tabla Rachas"
                }
              >
                {showRachaTable ? (
                  <MdiChevronDown
                    width={20}
                    height={20}
                    style={{ color: "var(--text)" }}
                  />
                ) : (
                  <MdiChevronUp
                    width={20}
                    height={20}
                    style={{ color: "var(--text)" }}
                  />
                )}
              </button>
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
            </div>
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
          {showRachaTable && (
            <SearchBar
              placeholder="Buscar usuario..."
              value={searchFilters.racha}
              onChange={(value) =>
                setSearchFilters((prev) => ({ ...prev, racha: value }))
              }
            />
          )}
          <div className="table-container">
            {showRachaTable ? (
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
                              <SolarFireBold
                                width={14}
                                height={14}
                                style={{
                                  verticalAlign: "baseline",
                                  color:
                                    !isRed && !isBlue
                                      ? "var(--text-2)"
                                      : isRed
                                      ? "rgba(128, 41, 26, 1)"
                                      : "rgba(26, 104, 128, 1)",
                                }}
                              />
                            </span>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            ) : (
              <div
                style={{
                  width: "100%",
                  minHeight: 40,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                }}
              >
                <div
                  style={{ padding: 0, width: "100%", marginTop: -10 }}
                  className="table-markdown"
                >
                  <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                    {`**¿Como funciona la racha?**

- Escribe al menos **<span style="color: var(--text-2);">un mensaje</span>** por directo para mantenerla.
- Si faltas a un directo, la racha se reinicia.
- La racha estara activa solo si tienes mas de 5 dias seguidos.

**¿Como congelar racha?**
- Si tienes al menos **<span style="color: var(--text-2);">24 tickets</span>** y tu racha **<span style="color: var(--text-2);">esta activa</span>**, se consumiran los tickets y se congelara al faltar a un directo automaticamente.
- Si sigues faltando, la racha se mantendra tantas veces como tickets tengas.
- Al siguiente directo que escribas, la racha se mantendra y aumentara.
- Sin tickets, la racha se reinicia.

**¿Que significan los colores?**
- **<span style="color: var(--text-2);">Normal:</span>** la racha esta mantenida
- **<span style="color: rgba(128, 41, 26, 1);">Rojo:</span>** falta mensaje en el directo actual
- **<span style="color: rgba(26, 104, 128, 1);">Azul:</span>** racha congelada, podras ampliarla`}
                  </ReactMarkdown>
                </div>
              </div>
            )}
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
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              {isMod ? (
                <button
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    marginRight: 6,
                    marginBottom: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                  onClick={() => setMensajesView((v) => (v === 2 ? 0 : v + 1))}
                  aria-label={
                    mensajesView === 0
                      ? "Mostrar información pública"
                      : mensajesView === 1
                      ? "Mostrar información de mods"
                      : "Mostrar tabla de mensajes"
                  }
                >
                  {mensajesView === 0 ? (
                    <MdiChevronDown
                      width={20}
                      height={20}
                      style={{ color: "var(--text)" }}
                    />
                  ) : mensajesView === 1 ? (
                    <MdiChevronDoubleDown
                      width={20}
                      height={20}
                      style={{ color: "var(--text)" }}
                    />
                  ) : (
                    <MdiChevronUp
                      width={20}
                      height={20}
                      style={{ color: "var(--text)" }}
                    />
                  )}
                </button>
              ) : (
                <button
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    marginRight: 6,
                    marginBottom: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                  onClick={() => setMensajesView((v) => (v === 1 ? 0 : 1))}
                  aria-label={
                    mensajesView === 0
                      ? "Mostrar información pública"
                      : "Mostrar tabla de mensajes"
                  }
                >
                  {mensajesView === 0 ? (
                    <MdiChevronDown
                      width={20}
                      height={20}
                      style={{ color: "var(--text)" }}
                    />
                  ) : (
                    <MdiChevronUp
                      width={20}
                      height={20}
                      style={{ color: "var(--text)" }}
                    />
                  )}
                </button>
              )}
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
            </div>
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
          {mensajesView === 0 && (
            <>
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
            </>
          )}
          {mensajesView === 1 && (
            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-start",
              }}
            >
              <div
                style={{ padding: 0, width: "100%", marginTop: -10 }}
                className="table-markdown"
              >
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                  {`
**Comandos del Chat**

- **<span style="color: var(--text-2);">spoiler</span>**
  - Le ocultara el historial de mensajes a Sara para asi evitar que lea el spoiler.
- **<span style="color: var(--text-2);">!clip</span>**
  - Clip automatico de los ultimos 30 segundos.
  - Se resubira al Discord.
- **<span style="color: var(--text-2);">!sr [cancion]</span>** → *!sr Ado - 罪と罰*
  - Si Sara lo activa, puedes añadir canciones a la lista de reproduccion.
- **<span style="color: var(--text-2);">!cum [dd/mm]</span>** → *!cum 03/08*
  - Cuando llegue el dia se te felicitara en el Discord.
  - Si hay directo ese dia, tambien se te felicitara por el chat.
`}
                </ReactMarkdown>
                {isMod ? (
                  // TODO: Puede que en un futuro ponga algo aqui asi que por ahora lo dejo asi jej
                  <ReactMarkdown rehypePlugins={[rehypeRaw]}></ReactMarkdown>
                ) : (
                  <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                    {`
**Moderadores Clandestinos**

*El acceso completo a esta informacion esta reservado a moderadores clandestinos*

*Si eres uno inicia sesion con tu cuenta de Twitch*
`}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          )}
          {isMod && mensajesView === 2 && (
            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-start",
              }}
            >
              <div
                style={{ padding: 0, width: "100%", marginTop: -10 }}
                className="table-markdown"
              >
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                  {`
**Moderadores Clandestinos**

- Si puedes ver esto, Sara te ha asignado como moderador clandestino.
- Puedes expulsar usuarios temporal o permanentemente si incumplen las normas.
- No estas obligado a actuar.

**Comandos del Chat**

- **<span style="color: var(--text-2); font-family: 'JetBrains Mono', monospace;">bs [usuario]</span>** → *Ban temporal (10m)*
- **<span style="color: var(--text-2); font-family: 'JetBrains Mono', monospace;">bn [usuario]</span>** → *Ban permanente*
- **<span style="color: var(--text-2); font-family: 'JetBrains Mono', monospace;">ub [usuario]</span>** → *Quitar ban*

**Guia Rapida**
- **<span style="color: var(--text-2); font-family: 'JetBrains Mono', monospace;">bs</span>** *(backsit)*
  - *Destripe de la historia de un juego*
  - *Ayuda no solicitada*
- **<span style="color: var(--text-2); font-family: 'JetBrains Mono', monospace;">bn</span>** *(ban)*
  - *Insultos y faltas de respeto*
  - *Incitacion al odio de cualquier tipo*
  - *Reiteracion de malos comportamientos*

*Los conflictos entre usuarios los gestiona Sara.*
`}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        <div className="stat-section">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              <button
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  marginRight: 6,
                  marginBottom: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                onClick={() => setShowTicketsTable((prev) => !prev)}
                aria-label={
                  showTicketsTable
                    ? "Ocultar tabla Tickets"
                    : "Mostrar tabla Tickets"
                }
              >
                {showTicketsTable ? (
                  <MdiChevronDown
                    width={20}
                    height={20}
                    style={{ color: "var(--text)" }}
                  />
                ) : (
                  <MdiChevronUp
                    width={20}
                    height={20}
                    style={{ color: "var(--text)" }}
                  />
                )}
              </button>
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
            </div>
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
          {showTicketsTable && (
            <SearchBar
              placeholder="Buscar usuario..."
              value={searchFilters.tickets}
              onChange={(value) =>
                setSearchFilters((prev) => ({ ...prev, tickets: value }))
              }
            />
          )}
          <div className="table-container">
            {showTicketsTable ? (
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
            ) : (
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                }}
              >
                <div
                  style={{ padding: 0, width: "100%", marginTop: -10 }}
                  className="table-markdown"
                >
                  <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                    {`
**¿Para que sirven los tickets?**
- Usar el Gacha consume **<span style="color: var(--text-2);">3 tickets</span>**.
- Congelar tu racha consume **<span style="color: var(--text-2);">24 tickets</span>**.

**¿Como conseguir tickets?**
- Ganando los minijuegos de la [GameBoy](/gameboy).
- Eventos que organice la Sara.
                    `}
                  </ReactMarkdown>
                </div>
              </div>
            )}
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
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              <button
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  marginRight: 6,
                  marginBottom: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                onClick={() => setShowEmotesTable((prev) => !prev)}
                aria-label={
                  showEmotesTable
                    ? "Ocultar tabla Emotes"
                    : "Mostrar tabla Emotes"
                }
              >
                {showEmotesTable ? (
                  <MdiChevronDown
                    width={20}
                    height={20}
                    style={{ color: "var(--text)" }}
                  />
                ) : (
                  <MdiChevronUp
                    width={20}
                    height={20}
                    style={{ color: "var(--text)" }}
                  />
                )}
              </button>
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
            </div>
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
          {showEmotesTable && (
            <SearchBar
              placeholder="Buscar usuario..."
              value={searchFilters.emotes}
              onChange={(value) =>
                setSearchFilters((prev) => ({ ...prev, emotes: value }))
              }
            />
          )}
          <div className="table-container">
            {showEmotesTable ? (
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
            ) : (
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                }}
              >
                <div
                  style={{ padding: 0, width: "100%", marginTop: -10 }}
                  className="table-markdown"
                >
                  <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                    {`
**¿No puedes ver los emotes?**
- Añade la extension de [7TV](https://7tv.app/).

**¿Que necesitas para añadir emotes?**
- <span style="font-weight: 500;">500 mensajes</span> y <span style="font-weight: 500;">3 meses</span> de follow
    - *5 huecos.*
- <span style="font-weight: 500;">10000 mensajes</span> y <span style="font-weight: 500;">1 año</span> de follow
    - *10 huecos.*

**Comandos de chat disponibles**
- **<span style="color: var(--text-2);">!asignar <url_emote7TV></span>**
    - *El emote que añadas tendra tu nombre (no consume hueco)*
- **<span style="color: var(--text-2);">!añadir <url_emote7TV></span>**
    - *Añade un emote.*
- **<span style="color: var(--text-2);">!añadir [nombre] <url_emote7TV></span>**
    - *Añade un emote con un nombre.*
- **<span style="color: var(--text-2);">!editar [nombre] [nuevo_nombre]</span>**
    - *Cambia el nombre de un emote.*
- **<span style="color: var(--text-2);">!eliminar [nombre]</span>**
    - *Elimina un emote.*
                    `}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className="top-section"
        style={{
          marginTop: "20px",
        }}
      >
        <div style={{ flex: 1 }}>
          <h2>Logros del Directo</h2>
          <div className="top-section-h2-down">
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
