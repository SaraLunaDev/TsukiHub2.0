import { useState, useEffect, useCallback } from "react";
import useLocalStorage from "./useLocalStorage";
import { STORAGE_KEYS, API_URLS } from "../constants/config";
import { getRolesFromToken } from "../utils/jwt-client";

export function useAuth() {
  const [twitchUser, setTwitchUser] = useLocalStorage(
    STORAGE_KEYS.TWITCH_USER,
    null
  );
  const [twitchToken, setTwitchToken] = useLocalStorage(
    STORAGE_KEYS.TWITCH_TOKEN,
    null
  );
  const [rolesToken, setRolesToken] = useLocalStorage(
    STORAGE_KEYS.ROLES_TOKEN,
    null
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const isAuthenticated = !!twitchUser && !!twitchToken;

  const getRoles = () => {
    if (!rolesToken) {
      return { isAdmin: false, isMod: false };
    }
    return getRolesFromToken(rolesToken);
  };

  const { isAdmin, isMod } = getRoles();

  const updateRoles = useCallback(async () => {
    if (!twitchUser || !twitchToken || isUpdating) return;

    if (rolesToken) {
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(API_URLS.VERIFY_USER, {
        headers: { Authorization: `Bearer ${twitchToken}` },
      });

      if (response.ok) {
        const { rolesToken: newToken } = await response.json();
        setRolesToken(newToken);
      } else {
        setRolesToken(null);
      }
    } catch (error) {
      setRolesToken(null);
    } finally {
      setIsUpdating(false);
    }
  }, [twitchUser, twitchToken, rolesToken, isUpdating, setRolesToken]);

  const logout = () => {
    setTwitchUser(null);
    setTwitchToken(null);
    setRolesToken(null);
  };

  useEffect(() => {
    if (isAuthenticated) {
      updateRoles();
    }
    
  }, [isAuthenticated, updateRoles]);

  return {
    user: twitchUser,
    token: twitchToken,
    isAuthenticated,
    isAdmin,
    isMod,
    updateRoles,
    logout,
    setUser: setTwitchUser,
    setToken: setTwitchToken,
    setRolesToken,
  };
}
