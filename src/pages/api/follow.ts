// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

import axios from "axios";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const accessToken = req.body.accessToken;
  const toFollow = req.body.toFollow as string[];
  const toUnfollow = req.body.toUnfollow as string[];

  console.log({ toFollow })
  console.log({ toUnfollow })

  const artistIdsJoin = toFollow.join('%');
  var i = 0;

  const headers = {
    'content-type': 'application/json',
    'Authorization': 'Bearer ' + accessToken
  }

  try {
    if (toFollow.length > 0) {
      do {
        const ids = toFollow.slice(i, i + 50);
        await axios.put(`https://api.spotify.com/v1/me/following?type=artist`, { "ids": ids }, { headers })
        i += 50;
      } while (i < toFollow.length);
    }

    if (toUnfollow.length > 0) {
      i = 0;
      do {
        const ids = toUnfollow.slice(i, i + 50);
        await axios.delete(`https://api.spotify.com/v1/me/following?type=artist`, {
          headers, data: { "ids": ids },
        })
        i += 50;
      } while (i < toUnfollow.length);
    }


    res.status(200).json({ msg: "all good" });
  } catch (error: any) {
    console.log("####", error.message);
    console.log("$$$$", error);
    res.status(400).json({ msg: "Oopsie : " + error.message });

  }
}