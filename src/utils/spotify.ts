import axios from 'axios';
import querystring from 'query-string';

const {
    SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET,
    SPOTIFY_REDIRECT_URI,
} = process.env;

const SPOTIFY_API = 'https://api.spotify.com/v1';

const getAccessToken = async (code: any) => {
    const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        querystring.stringify({
            grant_type: 'authorization_code',
            code,
            redirect_uri: SPOTIFY_REDIRECT_URI,
            client_id: SPOTIFY_CLIENT_ID,
            client_secret: SPOTIFY_CLIENT_SECRET,
        }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        }
    );

    return response.data;
};

const getUserProfile = async (accessToken: any) => {
    const response = await axios.get(`${SPOTIFY_API}/me`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    return response.data;
};

const getLikedSongs = async (accessToken: any) => {
    const response = await axios.get(`${SPOTIFY_API}/me/tracks`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    return response.data.items;
};

const followArtists = async (accessToken: any, artistIds: any[]) => {
    await axios.put(
        `${SPOTIFY_API}/me/following?type=artist&ids=${artistIds.join(',')}`,
        {},
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );
};

export { getAccessToken, getUserProfile, getLikedSongs, followArtists };
