

import React from "react";
import { useParams } from "react-router-dom";
import useLocalStorage from "../../../hooks/useLocalStorage";
import { STORAGE_KEYS } from "../../../constants/config";
import "./UserProfile.css";

function UserProfile() {
  const { username } = useParams();
  const [twitchUser] = useLocalStorage(STORAGE_KEYS.TWITCH_USER, null);

  const isOwnProfile = twitchUser && twitchUser.login === username;
  const displayName =
    isOwnProfile && twitchUser ? twitchUser.displayName : username;
  const userId = isOwnProfile && twitchUser ? twitchUser.id : undefined;

  return (
    <div className="main-container">
      <h1>Perfil de {displayName}</h1>
      <h2 className="userprofile-id">ID: {userId ? userId : "Desconocido"}</h2>
    </div>
  );
}

export default UserProfile;
