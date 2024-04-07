import { stringify } from 'querystring';
import type { NextApiRequest, NextApiResponse } from "next";

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI,
} = process.env;

import axios from "axios";
import { Artist, Item, Paging } from "~/utils/types";

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
        console.log("(((((((", error.message)
        res.status(400).json({ msg: "Oopsie : " });
        return;
      });
  }
  // }

  var returnSongs: Item[] = [];
  var followingTracksResponseData;
  const LIMIT = 50;

  var next: string | null = `https://api.spotify.com/v1/me/tracks?limit=${LIMIT}`;
  var isFollowingMap = new Map<string, boolean | undefined>();

  const headers = { 'Authorization': 'Bearer ' + accessToken };

  var firstResponseData: Paging | undefined;

  await axios.get(next, { headers })
    .then(firstResponse => firstResponseData = firstResponse.data)
    .catch(error => {
      console.log("lineeeee 54: ", error.response)
      const data = error.response.data as string;
      const notReg = data.includes('not registered');
      res.status(error.response.status).send({ msg: error.response.data, notReg });
      return;
    })

  if (!firstResponseData) {
    res.status(400).json({ msg: "Oopsie " });
    return
  }

  var songs = firstResponseData.items;

  for (const song of songs) {
    for (const artist of song.track.artists) {
      isFollowingMap.set(artist.id, undefined);
    }
  }
  returnSongs.push(...songs);

  const trackPromises: Promise<void>[] = [];
  for (let i = LIMIT; i < firstResponseData.total + LIMIT; i += LIMIT) {
    trackPromises.push(
      axios.get(`https://api.spotify.com/v1/me/tracks?limit=${LIMIT}&offset=${i}`, { headers })
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
        .catch((error) => {
          console.log(error.message)
          res.status(400).json({ msg: "Oopsie : " });
          return;
        })
    );
  }
  await Promise.all(trackPromises);

  const followingAndArtistPromises: Promise<void>[] = [];
  var artistMap = new Map<string, Artist | undefined>();

  const artistIds = Array.from(isFollowingMap.keys());
  for (let i = 0; i < artistIds.length; i += LIMIT) {
    const ids = artistIds.slice(i, i + LIMIT);
    const followingPromise: Promise<void> = axios.get(`https://api.spotify.com/v1/me/following/contains`, {
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
      console.log(error.message);
      res.status(400).json({ msg: "Oopsie : " });
      return;
    });
    followingAndArtistPromises.push(followingPromise)

    const artistPromise: Promise<void> = axios.get(`https://api.spotify.com/v1/artists`, {
      headers,
      params: {
        ids: ids.join(",")
      }
    }).then((response) => {
      // ids.map((id, i) => artistMap.set(id, response.data[i]))

      // console.log("^^^^^^ : ", response.data.artists);
      for (var k = 0; k < ids.length; k++) {
        artistMap.set(ids[k], response.data.artists[k]);
      }
    }).catch(error => {
      console.log(error.message);
      res.status(400).json({ msg: "Oopsie : " });
      return;
    });
    followingAndArtistPromises.push(artistPromise)

  }

  await Promise.all(followingAndArtistPromises);

  // console.log({ artistMap });

  returnSongs.forEach(item => {
    item.track.artists.forEach(artist => {
      artist.isFollowing = isFollowingMap.get(artist.id);
      artist.images = artistMap.get(artist.id)?.images
    })
  });

  var likedSongs = returnSongs
    .sort((a, b) => b.added_at < a.added_at ? -1 : 1)
    .map(item => ({ artists: item.track.artists, trackName: item.track.name, added_at: item.added_at }))
  var end = new Date().getTime();
  console.log(end - start);

  res.status(200).send({ likedSongs, accessToken });

}