// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI,
} = process.env;

import axios from "axios";
import { Item, Paging } from "~/utils/types";


async function isFollowing(artistId: string, accessToken: any): Promise<boolean> {
  var doesFollow = await axios.get(`https://api.spotify.com/v1/me/following/contains?type=artist&ids=${artistId}`,
    { headers: { 'Authorization': 'Bearer ' + accessToken } },)
  return doesFollow.data[0];
}

async function isFollowingBulk(artistId: string, accessToken: any): Promise<boolean> {
  var doesFollow = await axios.get(`https://api.spotify.com/v1/me/following/contains?type=artist`,
    { headers: { 'Authorization': 'Bearer ' + accessToken }, data: { "ids": ["ji"] } })
  return doesFollow.data[0];
}

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
    })
    // console.log(JSON.stringify(a, null, 4))
    // res.status(200).json(a);

    var accessToken = accessTokenResponse.data.access_token;

    // console.log({ accessToken })
    var returnSongs: Item[] = []
    var followingTracksResponse;
    var followingTracksResponseData;
    var next: string | null = "https://api.spotify.com/v1/me/tracks?limit=50";


    var artistIds: string[] = []
    var done = false;

    var isFollowingMap = new Map<string, boolean | undefined>();

    const headers = { 'Authorization': 'Bearer ' + accessToken };
    // while (next && !done) {
    while (next) {
      followingTracksResponse = await axios.get(next, { headers })
      followingTracksResponseData = followingTracksResponse.data as Paging
      var songs = followingTracksResponseData.items;
      for (const song of songs) {
        for (const artist of song.track.artists) {
          var isFollowingArtist = true;
          isFollowingMap.set(artist.id, true);
          // if (isFollowingArtist == undefined) {
          //   isFollowingArtist = await isFollowing(artist.id, accessToken);
          //   isFollowingMap.set(artist.id, isFollowingArtist);
          // }
          artist.isFollowing = isFollowingArtist;
        }
      }
      returnSongs.push(...songs);
      next = followingTracksResponseData.next;

      // done = true;
    }

    const keys = Array.from(isFollowingMap.keys());
    for (let i = 0; i < keys.length; i += 50) {
      const ids = keys.slice(i, i + 50);
      var doesFollow = await axios.get(`https://api.spotify.com/v1/me/following/contains`,
        {
          headers,
          params: {
            type: 'artist',
            ids: ids.join(",")
          }
        })
      for (var j = 0; j < ids.length; j++) {
        isFollowingMap.set(ids[j], doesFollow.data[j]);
      }
    }

    returnSongs.forEach(song => {
      song.track.artists.forEach(artist => artist.isFollowing = isFollowingMap.get(artist.id))
    });

    var trackNameAndArtists = returnSongs.map(song => song.track).map(track => ({ artists: track.artists, trackName: track.name }));
    var end = new Date().getTime();
    console.log(end - start);
    console.log(returnSongs.length);
    res.status(200).send({ trackNameAndArtists, accessToken });

  } catch (error: any) {
    console.log("####", error.message);
    res.status(400).json({ msg: "Oopsie : " + error.message });

  }
  // const api = SpotifyApi.withAccessToken("hi", {
  //   access_token: code,
  //   token_type: "code",
  //   expires_in: 1000000,
  //   refresh_token: "hj"
  // });

  // const a = axios.get("https://api.spotify.com/v1/me/tracks?offset=0&limit=1", {
  //   headers: {
  //     Authorization: `Bearer ${code}`,
  //   },
  // }).then((x) => console.log(x)).catch((x) => console.log(x.message))

  // res.status(200).json(api.tracks.get());

  // console.table(items.artists.items.map((item) => ({
  //   name: item.name,
  //   followers: item.followers.total,
  //   popularity: item.popularity,
  // })));
}