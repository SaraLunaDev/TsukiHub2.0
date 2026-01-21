import React from "react";
import "./UserRanking.css";

const UserRanking = ({
  users,
  pokemonCount,
  selectedUser,
  handleUserClick,
  activeGenerations,
  pokemonList,
  GENERATION_RANGES,
  className = "",
}) => {
  const sortedUsers = users.sort((a, b) => {
    const countA = pokemonCount.get(a.id) || 0;
    const countB = pokemonCount.get(b.id) || 0;
    return countB - countA;
  });

  const calculateUserPercentage = (userId) => {
    let captured = 0;
    let totalPossible = 0;

    activeGenerations.forEach((gen) => {
      const { start, end } = GENERATION_RANGES[gen];
      totalPossible += end - start + 1;

      captured += pokemonList.filter((p) => {
        const id = parseInt(p.pokemonId, 10);
        return id >= start && id <= end && p.Usuario === userId;
      }).length;
    });

    return totalPossible > 0
      ? ((captured / totalPossible) * 100).toFixed(0)
      : 0;
  };

  return (
    <div className={`normal-section user-ranking ${className}`}>
      <table className="user-ranking-table">
        <tbody>
          {sortedUsers.map((user, index) => {
            const count = pokemonCount.get(user.id) || 0;
            const rank = index + 1;
            const percentage = calculateUserPercentage(user.id);
            return (
              <tr
                key={user.id}
                className={`user-ranking-item ${
                  user.id === selectedUser ? "selected" : ""
                }`}
                onClick={() => handleUserClick(user.id)}
              >
                <td className="user-ranking-rank-cell">
                  <span
                    className={`user-ranking-rank user-ranking-rank-${rank}`}
                  >
                    #{rank}
                  </span>
                </td>
                <td className="user-ranking-pfp-cell">
                  <img
                    src={user.pfp}
                    alt={user.nombre}
                    className="user-ranking-pfp"
                  />
                </td>
                <td className="user-ranking-name-cell">
                  <span className="user-ranking-name">{user.nombre}</span>
                </td>
                <td className="user-ranking-count-cell">
                  <span className="user-ranking-count">{count}</span>
                </td>
                <td className="user-ranking-percentage-cell">
                  <span className="user-ranking-percentage">{percentage}%</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UserRanking;
