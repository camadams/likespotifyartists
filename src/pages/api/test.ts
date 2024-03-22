// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    var accessToken = 'BQBjyzdHOKAOOC6UAtrzvROjLNj9SbbeXXXMY-tZiRkRrUycRFgT-P_jS7V12oz7PR84_cJAi6wbd8uWMcgnHHQJx4B5ox-WYtuAmAyG7n3J5KB7zXBvAeSeR8xhZ2JN_TYefSxKAsLMo3uNhhnBgtXRrrjFRY9s3nKPpFoLtv0iQA9M2lArfDkIFC8HLe5dBkDFKwnlVNK0AEkmMkp2g2ds0Bm2VtP1wJGexNfrykfoOnlVa5h1iqW4hiBz';


    try {
        const ids = "4sOLJi96MhdlMv5Iz9YZT9";
        // const ids = "3Py4gpY3Qhk3ZmUKps21Rl%4sOLJi96MhdlMv5Iz9YZT9";
        // const ids = "3Py4gpY3Qhk3ZmUKps21Rl,4sOLJi96MhdlMv5Iz9YZT9,4GVXyrutMYKCQWZPDImV8f";
        const params = {
            type: 'artist',
            ids: '3Py4gpY3Qhk3ZmUKps21Rl,4sOLJi96MhdlMv5Iz9YZT9,4GVXyrutMYKCQWZPDImV8f' // Example artist IDs separated by commas
        };
        const headers = { 'Authorization': 'Bearer ' + accessToken };
        // const ids = ["3Py4gpY3Qhk3ZmUKps21Rl", "4sOLJi96MhdlMv5Iz9YZT9", "4GVXyrutMYKCQWZPDImV8f"]
        // const ids = ["3Py4gpY3Qhk3ZmUKps21Rl"]
        var doesFollow = await axios.get(`https://api.spotify.com/v1/me/following/contains`,
            // var doesFollow = await axios.get(`https://api.spotify.com/v1/me/following/contains?type=artist`,
            {
                headers: { 'Authorization': 'Bearer ' + accessToken },
                params: {
                    type: 'artist',
                    ids: '3Py4gpY3Qhk3ZmUKps21Rl,4sOLJi96MhdlMv5Iz9YZT9,4GVXyrutMYKCQWZPDImV8f' // Example artist IDs separated by commas
                }
            })
        // { params, headers })

        console.log(doesFollow.data);
        res.status(200).json({ msg: "hi" })
    } catch (error: any) {
        console.log((error).message);

        res.status(400).json({ msg: "oops" })
    }
}