// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

const {
    SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET,
    SPOTIFY_REDIRECT_URI,
} = process.env;

import { SpotifyApi } from "@spotify/web-api-ts-sdk";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    var code = req.query.code || null;
    var state = req.query.state || null;

    if (state === null) {
        res.redirect('/#' +
            JSON.stringify({
                error: 'state_mismatch'
            }));
    } else {
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: SPOTIFY_REDIRECT_URI,
                grant_type: 'authorization_code'
            },
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET, 'base64')
            },
            json: true
        };
    }
    // res.status(200).json({ items });

}




