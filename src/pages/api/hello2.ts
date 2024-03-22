import type { NextApiRequest, NextApiResponse } from "next";

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI,
} = process.env;

import axios from "axios";
import { Item, Paging } from "~/utils/types";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  var start = new Date().getTime();
  const code = req.body.code;
  try {
    const accessTokenResponse = await axios.post("https://accounts.spotify.com/api/token", {
      grant_type: "authorization_code",
      code: code,
      redirect_uri: SPOTIFY_REDIRECT_URI,
      client_secret: SPOTIFY_CLIENT_SECRET,
      client_id: SPOTIFY_CLIENT_ID,
    }, {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + (Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64'))
      }
    });

    var accessToken = accessTokenResponse.data.access_token;
    var returnSongs: Item[] = [];
    var followingTracksResponse;
    var followingTracksResponseData;
    var next: string | null = "https://api.spotify.com/v1/me/tracks?limit=50";
    var isFollowingMap = new Map<string, boolean | undefined>();

    const promises: Promise<void>[] = [];
    const headers = { 'Authorization': 'Bearer ' + accessToken };

    const x = await axios.get(next, { headers })
    var xData = x.data as Paging;

    const songs = xData.items;

    for (const song of songs) {
      for (const artist of song.track.artists) {
        isFollowingMap.set(artist.id, undefined);
      }
    }
    returnSongs.push(...songs);

    for (let i = 50; i < xData.total + 50; i += 50) {
      promises.push(
        axios.get(`https://api.spotify.com/v1/me/tracks?limit=50&offset=${i}`, { headers })
          .then((response) => {
            followingTracksResponseData = response.data as Paging;
            const songs = followingTracksResponseData.items;

            for (const item of songs) {
              for (const artist of item.track.artists) {
                isFollowingMap.set(artist.id, undefined);
              }
            }
            returnSongs.push(...songs);
            next = followingTracksResponseData.next;
          })
      );
    }
    await Promise.all(promises);

    const followingPromises: Promise<void>[] = [];

    const artistIds = Array.from(isFollowingMap.keys());
    for (let i = 0; i < artistIds.length; i += 50) {
      const ids = artistIds.slice(i, i + 50);
      followingPromises.push(axios.get(`https://api.spotify.com/v1/me/following/contains`, {
        headers,
        params: {
          type: 'artist',
          ids: ids.join(",")
        }
      }).then((response) => {
        for (var j = 0; j < ids.length; j++) {
          isFollowingMap.set(ids[j], response.data[j]);
        }
      }))
    }

    await Promise.all(followingPromises);

    returnSongs.forEach(item => {
      item.track.artists.forEach(artist => artist.isFollowing = isFollowingMap.get(artist.id))
    });

    var trackNameAndArtists = returnSongs
      .sort((a, b) => b.added_at < a.added_at ? -1 : 1)
      .map(item => item.track)
      .map(track => ({ artists: track.artists, trackName: track.name }))
    var end = new Date().getTime();
    console.log(end - start);

    res.status(200).send({ trackNameAndArtists, accessToken });

  } catch (error: any) {
    console.log("####", error.message);
    res.status(400).json({ msg: "Oopsie : " + error.message });
  }
}