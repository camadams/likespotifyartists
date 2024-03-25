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
  var accessToken = req.body.accessToken;
  const code = req.body.code;
  if (accessToken === undefined) {
    await axios.post("https://accounts.spotify.com/api/token", {
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
    })
      .then((accessTokenResponse) => { accessToken = accessTokenResponse.data.access_token })
      .catch(error => {
        console.log("$$$$$", error.message)
        res.status(error.response.status).json({ msg: "Oopsie : " });
        return;
      });
  }
  // }

  var returnSongs: Item[] = [];
  var followingTracksResponseData;
  var next: string | null = "https://api.spotify.com/v1/me/tracks?limit=50";
  var isFollowingMap = new Map<string, boolean | undefined>();

  const promises: Promise<void>[] = [];
  const headers = { 'Authorization': 'Bearer ' + accessToken };

  var xData: Paging | undefined;

  const x = await axios.get(next, { headers })
    .then(response => xData = response.data)
    .catch(error => {
      console.log("line 54: ", error.message, error.response.status)
      res.status(error.response.status).json({ msg: "Oopsie : " });
      return;
    })

  if (!xData) {
    res.status(400).json({ msg: "Oopsie " });
    return
  }

  var songs = xData.items;

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
        .catch(error => {
          console.log(error.message)
          res.status(error.response.status).json({ msg: "Oopsie : " });
          return;
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
    }).catch(error => {
      console.log(error.message)
      res.status(error.response.status).json({ msg: "Oopsie : " });
      return;
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

}