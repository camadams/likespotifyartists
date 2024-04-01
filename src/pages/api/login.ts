// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

const {
    SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET,
    SPOTIFY_REDIRECT_URI,
} = process.env;

import { SpotifyApi } from "@spotify/web-api-ts-sdk";
// import { stringify } from "querystring";
import stringify from "query-string";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    var state = generateRandomString(16);
    var scope = 'streaming user-read-email user-follow-modify user-read-private user-follow-read user-library-read user-library-modify user-read-playback-state user-modify-playback-state';

    res.redirect('https://accounts.spotify.com/authorize?' +
        stringify.stringify({
            response_type: 'code',
            client_id: SPOTIFY_CLIENT_ID,
            scope,
            state
        })
        + '&redirect_uri=' + SPOTIFY_REDIRECT_URI);
}

var generateRandomString = (length: number) => {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};
