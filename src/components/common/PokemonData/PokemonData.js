import React from "react";
import "./PokemonData.css";

const MOVES_DATA = {};

fetch("/static/resources/pokemon/moves.csv")
  .then((res) => res.text())
  .then((text) => {
    const lines = text.split("\n").slice(1);
    lines.forEach((line) => {
      const [name, type] = line.split(",");
      if (name && type) {
        MOVES_DATA[name.trim().toLowerCase()] = type.trim().toLowerCase();
      }
    });
  });

const TYPE_COLORS = {
  normal: "#A8A878",
  fire: "#F08030",
  water: "#6890F0",
  electric: "#F8D030",
  grass: "#78C850",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#8c70b8",
  dragon: "#703fe0",
  dark: "#705848",
  steel: "#B8B8D0",
  fairy: "#EE99AC",
};

function PokemonData({
  selectedPokemon,
  maxStats,
  capturedCount,
  totalPokemon,
  shinyCount,
}) {
  if (!selectedPokemon) return null;

  return (
    <div className="normal-section pokemon-data">
      <div className="region-stats">
        <div className="region-stats-box header-box">
          <div className="region-stat-item">
            <span className="region-stat-label">Region:</span>
            <span className="region-stat-value">
              <b>
                {capturedCount}/{totalPokemon}
              </b>
            </span>
          </div>
          <div className="region-stat-item">
            <span className="region-stat-label">Shinys:</span>
            <span className="region-stat-value">
              <b>{shinyCount}</b>
            </span>
          </div>
        </div>
      </div>
      <div className="pokemon-display-section">
        <div className="pokemon-display">
          <img
            src={selectedPokemon.gifUrl}
            alt={`Pokemon ${selectedPokemon.id}`}
            className="pokemon-display-img"
          />
          <div className="pokemon-display-info">
            <div className="pokemon-name-types">
              <div className="pokemon-types">
                {selectedPokemon.tipo1 &&
                  selectedPokemon.tipo1 !== "undefined" && (
                    <img
                      src={`/static/resources/pokemon/types/${selectedPokemon.tipo1.toLowerCase()}.png`}
                      alt={selectedPokemon.tipo1}
                      className="pokemon-type-icon"
                      title={selectedPokemon.tipo1}
                    />
                  )}
                {selectedPokemon.tipo2 &&
                  selectedPokemon.tipo2 !== "undefined" && (
                    <img
                      src={`/static/resources/pokemon/types/${selectedPokemon.tipo2.toLowerCase()}.png`}
                      alt={selectedPokemon.tipo2}
                      className="pokemon-type-icon"
                      title={selectedPokemon.tipo2}
                    />
                  )}
              </div>
              <span className="pokemon-display-name">
                {selectedPokemon.pokemonName || "Pokemon"}
              </span>
            </div>
            <div className="pokemon-moves">
              {[
                selectedPokemon.movimiento1,
                selectedPokemon.movimiento2,
                selectedPokemon.movimiento3,
                selectedPokemon.movimiento4,
              ]
                .filter((move) => move && move !== "undefined")
                .map((move, index) => {
                  const moveType = MOVES_DATA[move.toLowerCase()];
                  return (
                    <div key={index} className="pokemon-move">
                      {moveType && (
                        <div
                          className="pokemon-move-background"
                          style={{
                            backgroundColor: TYPE_COLORS[moveType] || "#ccc",
                          }}
                        />
                      )}
                      <div className="pokemon-move-content">
                        <span className="pokemon-move-name">{move}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
        <div className="pokemon-extra-stats region-stats-box">
          {(() => {
            let nivel = "-";
            let xpRaw = selectedPokemon.XP;
            if (xpRaw !== undefined && xpRaw !== null && xpRaw !== "") {
              let xpNum =
                typeof xpRaw === "number"
                  ? xpRaw
                  : parseFloat((xpRaw + "").replace(/,/g, ".").trim());
              if (!isNaN(xpNum)) {
                nivel = Math.floor(Math.sqrt(xpNum) / 10);
              }
            }
            let pesoKg = "-";
            let pesoRaw = selectedPokemon.Peso;
            if (pesoRaw !== undefined && pesoRaw !== null && pesoRaw !== "") {
              let pesoNum =
                typeof pesoRaw === "number"
                  ? pesoRaw
                  : parseFloat((pesoRaw + "").replace(/,/g, ".").trim());
              if (!isNaN(pesoNum)) {
                pesoKg = (pesoNum / 10).toFixed(1) + " kg";
              }
            }
            const shiny = selectedPokemon.Shiny?.toLowerCase() === "si";
            return (
              <>
                <div className="region-stat-item">
                  <span className="region-stat-label">Nivel:</span>
                  <span className="region-stat-value">
                    <b>{nivel}</b>
                  </span>
                </div>
                <div className="region-stat-item">
                  <span className="region-stat-label">Peso:</span>
                  <span className="region-stat-value">
                    <b>{pesoKg}</b>
                  </span>
                </div>
                <div className="region-stat-item">
                  <span className="region-stat-label">Shiny:</span>
                  <span className="region-stat-value">
                    <b>{shiny ? "Sí" : "No"}</b>
                  </span>
                </div>
              </>
            );
          })()}
        </div>
        <div className="pokemon-stats">
          {selectedPokemon.HP && (
            <>
              <div className="stat-row">
                <span className="stat-label">HP</span>
                <div className="stat-bar-container">
                  <div
                    className="stat-bar hp"
                    style={{
                      width: `${Math.round(
                        Math.min(
                          (parseInt(selectedPokemon.HP) / maxStats.HP) * 100,
                          100,
                        ),
                      )}%`,
                    }}
                  ></div>
                </div>
                <span className="stat-value">
                  {selectedPokemon.ivHP && (
                    <span className="stat-iv">
                      +{Math.round(selectedPokemon.ivHP)}
                    </span>
                  )}
                  {Math.round(selectedPokemon.HP)}
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Ataque</span>
                <div className="stat-bar-container">
                  <div
                    className="stat-bar attack"
                    style={{
                      width: `${Math.round(
                        Math.min(
                          (parseInt(selectedPokemon.Ataque) / maxStats.Ataque) *
                            100,
                          100,
                        ),
                      )}%`,
                    }}
                  ></div>
                </div>
                <span className="stat-value">
                  {selectedPokemon.ivAtaque && (
                    <span className="stat-iv">
                      +{Math.round(selectedPokemon.ivAtaque)}
                    </span>
                  )}
                  {Math.round(selectedPokemon.Ataque)}
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Defensa</span>
                <div className="stat-bar-container">
                  <div
                    className="stat-bar defense"
                    style={{
                      width: `${Math.round(
                        Math.min(
                          (parseInt(selectedPokemon.Defensa) /
                            maxStats.Defensa) *
                            100,
                          100,
                        ),
                      )}%`,
                    }}
                  ></div>
                </div>
                <span className="stat-value">
                  {selectedPokemon.ivDefensa && (
                    <span className="stat-iv">
                      +{Math.round(selectedPokemon.ivDefensa)}
                    </span>
                  )}
                  {Math.round(selectedPokemon.Defensa)}
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">At. Esp</span>
                <div className="stat-bar-container">
                  <div
                    className="stat-bar sp-atk"
                    style={{
                      width: `${Math.round(
                        Math.min(
                          (parseInt(selectedPokemon.AtaqueEsp) /
                            maxStats.AtaqueEsp) *
                            100,
                          100,
                        ),
                      )}%`,
                    }}
                  ></div>
                </div>
                <span className="stat-value">
                  {selectedPokemon.ivAtaqueEsp && (
                    <span className="stat-iv">
                      +{Math.round(selectedPokemon.ivAtaqueEsp)}
                    </span>
                  )}
                  {Math.round(selectedPokemon.AtaqueEsp)}
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Def. Esp</span>
                <div className="stat-bar-container">
                  <div
                    className="stat-bar sp-def"
                    style={{
                      width: `${Math.round(
                        Math.min(
                          (parseInt(selectedPokemon.DefensaEsp) /
                            maxStats.DefensaEsp) *
                            100,
                          100,
                        ),
                      )}%`,
                    }}
                  ></div>
                </div>
                <span className="stat-value">
                  {selectedPokemon.ivDefensaEsp && (
                    <span className="stat-iv">
                      +{Math.round(selectedPokemon.ivDefensaEsp)}
                    </span>
                  )}
                  {Math.round(selectedPokemon.DefensaEsp)}
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Velocidad</span>
                <div className="stat-bar-container">
                  <div
                    className="stat-bar speed"
                    style={{
                      width: `${Math.round(
                        Math.min(
                          (parseInt(selectedPokemon.Velocidad) /
                            maxStats.Velocidad) *
                            100,
                          100,
                        ),
                      )}%`,
                    }}
                  ></div>
                </div>
                <span className="stat-value">
                  {selectedPokemon.ivVelocidad && (
                    <span className="stat-iv">
                      +{Math.round(selectedPokemon.ivVelocidad)}
                    </span>
                  )}
                  {Math.round(selectedPokemon.Velocidad)}
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Total</span>
                <div className="stat-bar-container">
                  <div
                    className="stat-bar total"
                    style={{
                      width: `${Math.round(
                        Math.min(
                          ((parseInt(selectedPokemon.HP) +
                            parseInt(selectedPokemon.Ataque) +
                            parseInt(selectedPokemon.Defensa) +
                            parseInt(selectedPokemon.AtaqueEsp) +
                            parseInt(selectedPokemon.DefensaEsp) +
                            parseInt(selectedPokemon.Velocidad)) /
                            maxStats.Total) *
                            100,
                          100,
                        ),
                      )}%`,
                    }}
                  ></div>
                </div>
                <span className="stat-value">
                  {Math.round(
                    parseInt(selectedPokemon.HP) +
                      parseInt(selectedPokemon.Ataque) +
                      parseInt(selectedPokemon.Defensa) +
                      parseInt(selectedPokemon.AtaqueEsp) +
                      parseInt(selectedPokemon.DefensaEsp) +
                      parseInt(selectedPokemon.Velocidad),
                  )}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PokemonData;
