// ============================================
// COMPONENTE: UserProfile
// ============================================
// Pagina de perfil de usuario con sus estadisticas personales

import React from 'react';
import { useParams } from 'react-router-dom';
import useLocalStorage from '../../../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../../../constants/config';
import './UserProfile.css';

function UserProfile() {
    const { username } = useParams();
    const [twitchUser] = useLocalStorage(STORAGE_KEYS.TWITCH_USER, null);

    // Verificar si el usuario esta viendo su propio perfil
    const isOwnProfile = twitchUser && twitchUser.login === username;

    return (
        <div className="user-profile-container">
            <div className="user-profile-content">
                <h1>Perfil de {isOwnProfile && twitchUser ? twitchUser.displayName : username}</h1>
                
                <div className="user-profile-body">
                    {isOwnProfile && twitchUser && (
                        <div className="user-profile-info">
                            <img 
                                src={twitchUser.profileImage} 
                                alt={twitchUser.displayName}
                                className="user-profile-avatar"
                            />
                            <p className="user-profile-name">{twitchUser.displayName}</p>
                            <p className="user-profile-id">ID: {twitchUser.id}</p>
                        </div>
                    )}

                    {!isOwnProfile && (
                        <p className="user-profile-placeholder">
                            Mostrando perfil publico de {username}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserProfile;
