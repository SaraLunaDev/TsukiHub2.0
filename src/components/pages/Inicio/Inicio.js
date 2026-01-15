import React, { useState, useMemo, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { useGoogleSheet } from "../../../hooks/useGoogleSheet";
import { useSheetConfig } from "../../../hooks/useSheetConfig";
import { useAuth } from "../../../hooks/useAuth";

import { MdiChevronUp } from "../../icons/MdiChevronUp";
import { MdiChevronDown } from "../../icons/MdiChevronDown";
import { MdiChevronDoubleDown } from "../../icons/MdiChevronDoubleDown";
import { FluentChevronUpDown16Filled } from "../../icons/FluentChevronUpDown16Filled";
import { MaterialSymbolsAndroidMessages } from "../../icons/MaterialSymbolsAndroidMessages";
import { IonTicket } from "../../icons/IonTicket";
import { SolarFireBold } from "../../icons/SolarFireBold";
import { TablerDiamondFilled } from "../../icons/TablerDiamondFilled";
import StatTable from "../../common/StatTable/StatTable";
import AchievementSection from "../../common/AchievementSection/AchievementSection";
import StatSection from "../../common/StatSection/StatSection";
import SearchBar from "../../common/SearchBar";
import "./Inicio.css";

const EXCLUDED_USERS = ["TsukiSoft", "TsukiwiChan"];

function Inicio() {
  const { user: isMod } = useAuth();
  const { config } = useSheetConfig();
  const [emotesRowLines, setEmotesRowLines] = useState({});
  const [expandedAchievements, setExpandedAchievements] = useState([]);
  const achievementsGridRef = useRef(null);
  const emotesTableRef = useRef(null);
  const [maxUsersMap, setMaxUsersMap] = useState({});
  const [maxEmotesPerRow, setMaxEmotesPerRow] = useState({});
  const [showRachaTable, setShowRachaTable] = useState(true);
  const [mensajesView, setMensajesView] = useState(0);
  const [showTicketsTable, setShowTicketsTable] = useState(true);
  const [showEmotesTable, setShowEmotesTable] = useState(true);
  const {
    data: rawData,
    loading,
    error,
  } = useGoogleSheet(config?.userdataSheetUrl || "", "userData");

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

  useEffect(() => {
    const emotesTable = emotesTableRef.current;
    if (!emotesTable || !showEmotesTable) return;

    const updateMaxEmotes = () => {
      const rows = emotesTable.querySelectorAll("tbody tr");
      const newMap = {};

      rows.forEach((row, rowIndex) => {
        const emotesContainer = row.querySelector(".emotes-container");
        if (!emotesContainer) return;

        const emoteLinks = Array.from(emotesContainer.querySelectorAll("a"));
        if (emoteLinks.length === 0) return;

        const containerWidth = emotesContainer.offsetWidth;
        const buttonWidth = 36;
        const gap = 4;
        const availableWidthFull = containerWidth;
        const availableWidthWithButton = containerWidth - buttonWidth;

        let accumulatedWidth = 0;
        let allFit = true;

        for (let i = 0; i < emoteLinks.length; i++) {
          const link = emoteLinks[i];
          const emote = link.querySelector(".emote-icon");
          if (!emote) continue;

          const originalDisplay = link.style.display;
          link.style.display = "inline-block";

          const emoteRect = emote.getBoundingClientRect();
          const emoteWidth = emoteRect.width || 24;

          link.style.display = originalDisplay;

          const widthWithGap = emoteWidth + (i > 0 ? gap : 0);
          accumulatedWidth += widthWithGap;

          if (accumulatedWidth > availableWidthFull) {
            allFit = false;
            break;
          }
        }

        if (allFit) {
          newMap[rowIndex] = emoteLinks.length;
        } else {
          accumulatedWidth = 0;
          let maxEmotes = 0;

          for (let i = 0; i < emoteLinks.length; i++) {
            const link = emoteLinks[i];
            const emote = link.querySelector(".emote-icon");
            if (!emote) continue;

            const originalDisplay = link.style.display;
            link.style.display = "inline-block";

            const emoteRect = emote.getBoundingClientRect();
            const emoteWidth = emoteRect.width || 24;

            link.style.display = originalDisplay;

            const widthWithGap = emoteWidth + (i > 0 ? gap : 0);
            const newTotal = accumulatedWidth + widthWithGap;

            if (newTotal <= availableWidthWithButton) {
              maxEmotes++;
              accumulatedWidth = newTotal;
            } else {
              break;
            }
          }

          newMap[rowIndex] = Math.max(2, maxEmotes);
        }
      });

      const hasChanges =
        Object.keys(newMap).some(
          (key) => newMap[key] !== maxEmotesPerRow[key]
        ) || Object.keys(maxEmotesPerRow).length !== Object.keys(newMap).length;

      if (hasChanges) {
        setMaxEmotesPerRow(newMap);
      }
    };

    const images = emotesTable.querySelectorAll(".emote-icon");
    let loadedCount = 0;
    const totalImages = images.length;

    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalImages) {
        setTimeout(updateMaxEmotes, 50);
      }
    };

    if (totalImages === 0) {
      updateMaxEmotes();
    } else {
      images.forEach((img) => {
        if (img.complete) {
          checkAllLoaded();
        } else {
          img.addEventListener("load", checkAllLoaded);
          img.addEventListener("error", checkAllLoaded);
        }
      });
    }

    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateMaxEmotes, 50);
    };

    window.addEventListener("resize", handleResize);
    const observer = new window.ResizeObserver(handleResize);
    observer.observe(emotesTable);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
      images.forEach((img) => {
        img.removeEventListener("load", checkAllLoaded);
        img.removeEventListener("error", checkAllLoaded);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEmotesTable, userData, searchFilters.emotes, emotesRowLines]);

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
        <h2>Tablas de Datos</h2>
        <div className="top-section-h2-down">
          <span>
            <b>{userData.length}</b> usuario{userData.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="stats-grid inset-section">
        <StatSection
          title="Rachas"
          icon={
            showRachaTable ? (
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
            )
          }
          expanded={showRachaTable}
          onToggle={() => setShowRachaTable((prev) => !prev)}
          subtitle={`${
            userData.filter((user) => {
              const rachaStr = String(user.racha || "");
              const rachaNum =
                rachaStr.startsWith("m_") || rachaStr.startsWith("f_")
                  ? parseInt(rachaStr.slice(2), 10)
                  : parseInt(rachaStr, 10);
              return !isNaN(rachaNum) && rachaNum >= 5;
            }).length
          } activas`}
          searchBar={
            showRachaTable && (
              <SearchBar
                placeholder="Buscar usuario..."
                value={searchFilters.racha}
                onChange={(value) =>
                  setSearchFilters((prev) => ({ ...prev, racha: value }))
                }
              />
            )
          }
        >
          <div className="table-container">
            {showRachaTable ? (
              <StatTable
                type="racha"
                rowKey="id"
                rows={getTopUsers("racha", 10, searchFilters.racha)}
                columns={[
                  {
                    key: "pfp",
                    className: "user-avatar-cell",
                    render: (row) => (
                      <img
                        src={row.pfp}
                        alt={row.nombre}
                        className="profile-pic"
                      />
                    ),
                  },
                  { key: "nombre" },
                  {
                    key: "racha",
                    icon: (
                      <SolarFireBold
                        width={14}
                        height={14}
                        style={{ verticalAlign: "baseline" }}
                      />
                    ),
                  },
                ]}
              />
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
        </StatSection>

        <StatSection
          title="Mensajes"
          icon={
            isMod ? (
              mensajesView === 0 ? (
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
              )
            ) : mensajesView === 0 ? (
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
            )
          }
          expanded={mensajesView === 0}
          onToggle={
            isMod
              ? () => setMensajesView((v) => (v === 2 ? 0 : v + 1))
              : () => setMensajesView((v) => (v === 1 ? 0 : 1))
          }
          subtitle={`${userData.reduce(
            (acc, user) => acc + (parseInt(user.mensajes, 10) || 0),
            0
          )} mensajes`}
          searchBar={
            mensajesView === 0 && (
              <SearchBar
                placeholder="Buscar usuario..."
                value={searchFilters.mensajes}
                onChange={(value) =>
                  setSearchFilters((prev) => ({ ...prev, mensajes: value }))
                }
              />
            )
          }
        >
          {mensajesView === 0 && (
            <div className="table-container">
              <StatTable
                type="mensajes"
                rowKey="id"
                rows={getTopUsers("mensajes", 10, searchFilters.mensajes)}
                columns={[
                  {
                    key: "pfp",
                    className: "user-avatar-cell",
                    render: (row) => (
                      <img
                        src={row.pfp}
                        alt={row.nombre}
                        className="profile-pic"
                      />
                    ),
                  },
                  { key: "nombre" },
                  {
                    key: "mensajes",
                    icon: (
                      <MaterialSymbolsAndroidMessages
                        style={{
                          verticalAlign: "baseline",
                          color: "var(--text-2)",
                        }}
                        width="14"
                        height="14"
                      />
                    ),
                  },
                ]}
              />
            </div>
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
        </StatSection>

        <StatSection
          title="Tickets"
          icon={
            showTicketsTable ? (
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
            )
          }
          expanded={showTicketsTable}
          onToggle={() => setShowTicketsTable((prev) => !prev)}
          subtitle={`${userData.reduce(
            (acc, user) => acc + (parseInt(user.tickets, 10) || 0),
            0
          )} tickets`}
          searchBar={
            showTicketsTable && (
              <SearchBar
                placeholder="Buscar usuario..."
                value={searchFilters.tickets}
                onChange={(value) =>
                  setSearchFilters((prev) => ({ ...prev, tickets: value }))
                }
              />
            )
          }
        >
          <div className="table-container">
            {showTicketsTable ? (
              <StatTable
                type="tickets"
                rowKey="id"
                rows={getTopUsers("tickets", 10, searchFilters.tickets)}
                columns={[
                  {
                    key: "pfp",
                    className: "user-avatar-cell",
                    render: (row) => (
                      <img
                        src={row.pfp}
                        alt={row.nombre}
                        className="profile-pic"
                      />
                    ),
                  },
                  { key: "nombre" },
                  {
                    key: "tickets",
                    icon: (
                      <IonTicket
                        style={{
                          verticalAlign: "baseline",
                          color: "var(--text-2)",
                        }}
                        width="14"
                        height="14"
                      />
                    ),
                  },
                ]}
              />
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
        </StatSection>

        <StatSection
          title="Emotes"
          icon={
            showEmotesTable ? (
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
            )
          }
          expanded={showEmotesTable}
          onToggle={() => setShowEmotesTable((prev) => !prev)}
          subtitle={`${userData.reduce(
            (acc, user) =>
              acc + (Array.isArray(user.emotes) ? user.emotes.length : 0),
            0
          )} emotes`}
          searchBar={
            showEmotesTable && (
              <SearchBar
                placeholder="Buscar usuario..."
                value={searchFilters.emotes}
                onChange={(value) =>
                  setSearchFilters((prev) => ({ ...prev, emotes: value }))
                }
              />
            )
          }
        >
          <div className="table-container" ref={emotesTableRef}>
            {showEmotesTable ? (
              <StatTable
                type="emotes"
                rowKey="id"
                rows={getTopUsers("emotes", 10, searchFilters.emotes).map(
                  (user, index) => {
                    const maxEmotesPerLine = maxEmotesPerRow[index] || 999;
                    const allEmotes = Array.isArray(user.emotes)
                      ? user.emotes
                      : [];
                    const currentLineIndex = emotesRowLines[index] || 0;
                    const totalLinesNeeded = Math.ceil(
                      allEmotes.length / maxEmotesPerLine
                    );
                    const hasMany = totalLinesNeeded > 1;

                    const startIndex = currentLineIndex * maxEmotesPerLine;
                    const endIndex = Math.min(
                      startIndex + maxEmotesPerLine,
                      allEmotes.length
                    );

                    return {
                      ...user,
                      allEmotes,
                      startIndex,
                      endIndex,
                      maxEmotesPerLine,
                      currentLineIndex,
                      totalLinesNeeded,
                      hasMany,
                      rowIndex: index,
                    };
                  }
                )}
                columns={[
                  {
                    key: "pfp",
                    className: "user-avatar-cell",
                    render: (row) => (
                      <img
                        src={row.pfp}
                        alt={row.nombre}
                        className="profile-pic"
                        title={row.nombre}
                      />
                    ),
                  },
                  {
                    key: "emotes",
                    className: "emotes-cell",
                    render: (row) => {
                      const hasChevron = row.hasMany;
                      const isFirstLine = row.currentLineIndex === 0;
                      const isLastLine =
                        row.currentLineIndex === row.totalLinesNeeded - 1;
                      const isMiddleLine = !isFirstLine && !isLastLine;

                      const handleCycle = () => {
                        setEmotesRowLines((prev) => {
                          const currentLine = prev[row.rowIndex] || 0;
                          const nextLine =
                            (currentLine + 1) % row.totalLinesNeeded;
                          if (nextLine === 0) {
                            const newState = { ...prev };
                            delete newState[row.rowIndex];
                            return newState;
                          }
                          return { ...prev, [row.rowIndex]: nextLine };
                        });
                      };

                      let chevronIcon;
                      let buttonClass;

                      if (isLastLine) {
                        chevronIcon = (
                          <MdiChevronUp
                            width={22}
                            height={22}
                            style={{ color: "var(--text-2)" }}
                          />
                        );
                        buttonClass = "emotes-collapse-btn";
                      } else if (isMiddleLine) {
                        chevronIcon = (
                          <FluentChevronUpDown16Filled
                            width={22}
                            height={22}
                            style={{ color: "var(--text-2)" }}
                          />
                        );
                        buttonClass = "emotes-expand-btn";
                      } else {
                        chevronIcon = (
                          <MdiChevronDown
                            width={22}
                            height={22}
                            style={{ color: "var(--text-2)" }}
                          />
                        );
                        buttonClass = "emotes-expand-btn";
                      }

                      return (
                        <div
                          className={`emotes-container${
                            hasChevron ? " has-chevron" : ""
                          }`}
                        >
                          {row.allEmotes &&
                            row.allEmotes.map((emoteId, emoteIndex) => {
                              const isInCurrentLine =
                                emoteIndex >= row.startIndex &&
                                emoteIndex < row.endIndex;

                              return (
                                <a
                                  key={emoteIndex}
                                  href={`https://7tv.app/emotes/${emoteId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: isInCurrentLine
                                      ? "inline-block"
                                      : "none",
                                  }}
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
                              );
                            })}
                          {row.hasMany && (
                            <button
                              className={buttonClass}
                              title={`${row.currentLineIndex + 1} de ${
                                row.totalLinesNeeded
                              }`}
                              onClick={handleCycle}
                              style={{
                                background: "none",
                                border: "none",
                                padding: 0,
                                cursor: "pointer",
                                verticalAlign: "middle",
                                display: "inline-flex",
                              }}
                            >
                              {chevronIcon}
                            </button>
                          )}
                        </div>
                      );
                    },
                  },
                ]}
              />
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
        </StatSection>
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
                {userData
                  .filter(
                    (user) =>
                      user.l_platino &&
                      user.l_platino.toString().toLowerCase() === "si"
                  )
                  .map((user, idx) => (
                    <div
                      key={user.id || user.nombre || idx}
                      className="platino-avatar-wrapper"
                    >
                      <img
                        src={user.pfp}
                        alt={user.nombre}
                        className="achievement-user-avatar"
                        title={user.nombre}
                      />
                      <TablerDiamondFilled className="platino-diamond-badge" />
                    </div>
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
            <AchievementSection
              key={key}
              details={{ ...details, key }}
              users={users}
              expanded={expanded}
              maxUsers={maxUsers}
              onToggle={() =>
                setExpandedAchievements((prev) =>
                  expanded ? prev.filter((k) => k !== key) : [...prev, key]
                )
              }
            />
          );
        })}
      </div>
    </div>
  );
}

export default Inicio;
