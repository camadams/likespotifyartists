import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Link from "next/link";
import { Artist, TrackNameAndArtists } from "~/utils/types";
import { LoadingSpinner } from "~/LoadingSpinner";
import { toast } from "react-hot-toast";

type HelloResponse = {
  trackNameAndArtists: TrackNameAndArtists[];
  accessToken: string;
};

const callHelloApiRoute = async (code: any): Promise<HelloResponse> => {
  var url = `${
    process.env.NODE_ENV === "development"
      ? "https://localhost:3000"
      : "https://likeartists.vercel.app"
  }`;

  const response = await axios.post(`${url}/api/hello2`, {
    code: code,
  });

  return response.data;
};

export default function Home() {
  const [likedTracks, setLikedSongs] = useState<TrackNameAndArtists[]>([]);
  const [accessToken, setAccessToken] = useState<string>();
  const [loadingLikedTracks, setLoadingLikedTracks] = useState<boolean>(false);
  const [isGroupByArtist, setIsGroupByArtist] = useState<boolean>(true);
  const [following, setFollowingArtitstIds] = useState<string[]>([]);
  const [toFollow, setToFollow] = useState<string[]>([]);
  const [toUnfollow, setToUnfollow] = useState<string[]>([]);
  const [groupById, setGroupById] = useState(0);

  const router = useRouter();

  useEffect(() => {
    const { code } = router.query;
    if (code && likedTracks.length == 0) {
      setLoadingLikedTracks(() => true);
      toast.success(code as string);

      callHelloApiRoute(code)
        .then((items) => {
          setLikedSongs(() => items.trackNameAndArtists);
          setFollowingArtitstIds(() => {
            const uniqueArtistIds = Array.from(
              new Set(
                items.trackNameAndArtists.flatMap((x) =>
                  [...x.artists]
                    .filter((artist) => artist.isFollowing)
                    .map((artist) => artist.id)
                )
              )
            );
            return uniqueArtistIds;
          });
          setAccessToken(() => items.accessToken);
          setLoadingLikedTracks(() => false);
          console.log("herererere");
        })
        .catch((error) => console.error("&&& Error:", error));
    }
  }, [likedTracks.length, router.query, router.query.code]);

  const handelLoggedInClicked = () => {
    setLoadingLikedTracks(() => true);
  };

  const handleFollow = async (artistId: string) => {
    if (following.includes(artistId)) {
      if (toUnfollow.includes(artistId)) {
        setToUnfollow((prev) => prev.filter((x) => x !== artistId));
      } else {
        setToUnfollow((prev) => [...prev, artistId]);
      }
    } else {
      if (toFollow.includes(artistId)) {
        setToFollow((prev) => prev.filter((x) => x !== artistId));
      } else {
        setToFollow((prev) => [...prev, artistId]);
      }
    }
    return;
  };

  const handleSave = () => {
    callFollowApiRoute();
    setToFollow(() => []);
  };

  const doGroupingByArtist = (tracks: TrackNameAndArtists[]) => {
    const map = new Map<string, string[]>();
    tracks.forEach(({ trackName, artists }) => {
      artists.forEach((artist) => {
        const tracksOfArt = map.get(artist.id) || [];
        map.set(artist.id, [trackName, ...tracksOfArt]);
      });
    });
    return map;
  };

  function getArtistNameFromId(artistId: string): Artist | null {
    if (likedTracks) {
      for (let i = 0; i < likedTracks.length; i++) {
        const track = likedTracks[i];
        for (let j = 0; j < track.artists.length; j++) {
          const artist = track.artists[j];
          if (artist.id == artistId) {
            return artist;
          }
        }
      }
    }
    return null;
  }

  const callFollowApiRoute = async () => {
    var url = `${
      process.env.NODE_ENV === "development"
        ? "https://localhost:3000"
        : "https://likeartists.vercel.app"
    }`;

    const response = await axios.put(`${url}/api/follow`, {
      toFollow: toFollow,
      toUnfollow: toUnfollow,
      accessToken,
    });
    console.log(response.data);
  };

  const FollowingNotFollowingButton = ({
    artistId,
    green,
  }: {
    artistId: string;
    green: boolean;
  }) => {
    return (
      <button
        onClick={() => handleFollow(artistId)}
        className={`px-2 rounded-full text-sm font-semibold text-black ${
          green
            ? "bg-green-500 hover:bg-green-300"
            : "bg-yellow-500 hover:bg-yellow-300"
        } `}
      >
        {green ? "Following" : "Not Following"}
      </button>
    );
  };

  const Card = ({
    main,
    sub,
  }: {
    main: Artist | string;
    sub: Artist[] | string[];
  }) => {
    return (
      <div className="mb-3">
        <div className="flex justify-between">
          <a
            target={typeof main !== "string" ? "_blank" : ""}
            href={typeof main !== "string" ? main.external_urls.spotify : "#"}
            className=" text-yellow-500"
          >
            {typeof main !== "string" ? main.name : main}
          </a>

          {typeof main !== "string" && (
            <FollowingNotFollowingButton
              artistId={main.id}
              green={
                !toUnfollow.includes(main.id) &&
                (following.includes(main.id) || toFollow.includes(main.id))
              }
            />
          )}
        </div>
        <div className="pl-4">
          {sub.map((x, index) => (
            <div className="text-xs flex justify-between " key={index}>
              {typeof x !== "string" ? x.name : x}
              {typeof x !== "string" && (
                <FollowingNotFollowingButton
                  artistId={x.id}
                  green={
                    !toUnfollow.includes(x.id) &&
                    (following.includes(x.id) || toFollow.includes(x.id))
                  }
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleFollowAll = () => {
    setToFollow(() => {
      const uniqueArtistIds = Array.from(
        new Set(
          likedTracks.flatMap((x) =>
            [...x.artists]
              .filter((artist) => !artist.isFollowing)
              .map((artist) => artist.id)
          )
        )
      );
      return uniqueArtistIds;
    });
  };

  // if (likedTracks.length == 0) {
  //   return (
  //     <div className="fiex h-screen items-center justify-center">
  //       <Link
  //         className="rounded-full bg-green-500 px-4 py-2 fiex text-black  items-center justify-center"
  //         onClick={handelLoggedInClicked}
  //         href={"/api/login"}
  //       >
  //         Login with Spotify
  //       </Link>
  //     </div>
  //   );
  // }

  return (
    <div className="container p-4 md:px-48 relative pb-10">
      {(toFollow.length > 0 || toUnfollow.length > 0) && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 h-10 text-center items-center">
          {toFollow.length > 0 && `Follow ${toFollow.length} artist(s). `}
          {toUnfollow.length > 0 && `Un-follow ${toUnfollow.length} artist(s)`}
          <button
            className="bg-green-600 rounded-full px-2"
            onClick={handleSave}
          >
            Confrim
          </button>
          <button
            className="bg-red-600 rounded-full px-2"
            onClick={() => {
              setToFollow(() => []);
              setToUnfollow(() => []);
            }}
          >
            Cancel
          </button>
        </div>
      )}
      <Link onClick={handelLoggedInClicked} href={"/api/login"}>
        login
      </Link>

      {!!loadingLikedTracks && (
        <div className="w-10">
          <LoadingSpinner />
        </div>
      )}

      {/* <div className="text-xs">
        {
          <div>
            {toFollow?.map((x, i) => (
              <div className="bg-green-600" key={i}>
                {x}
              </div>
            ))}
          </div>
        }
        {
          <div>
            {toUnfollow?.map((x, i) => (
              <div className="bg-red-500" key={i}>
                {x}
              </div>
            ))}
          </div>
        }
        {
          <div>
            {following?.map((x, i) => (
              <div className="bg-yellow-400" key={i}>
                {x}
              </div>
            ))}
          </div>
        }
      </div> */}

      {likedTracks && (
        <div>
          <button
            className={`rounded-full px-2 border-fuchsia-600 border-2 ${
              groupById == 0 ? "bg-fuchsia-500" : ""
            }`}
            onClick={() => setGroupById(() => 0)}
          >
            Group by Artist
          </button>

          <button
            className={`rounded-full px-2 border-blue-500 border-2 ${
              groupById == 1 ? "bg-blue-500" : ""
            }`}
            onClick={() => setGroupById(() => 1)}
          >
            Group by Track
          </button>

          <div className="p-4" />
          <div className="flex justify-end">
            <button
              className="rounded-full px-2 bg-orange-500 text-black hover:bg-orange-400"
              onClick={handleFollowAll}
            >
              Follow All
            </button>
          </div>

          {groupById == 1 ? (
            <div>
              {likedTracks?.map((track, i) => (
                <Card key={i} main={track.trackName} sub={track.artists} />
              ))}
            </div>
          ) : (
            <div>
              {Array.from(doGroupingByArtist(likedTracks).entries()).map(
                ([artistId, trackNames], i) => {
                  var artist = getArtistNameFromId(artistId);
                  if (!artist) return;
                  return <Card key={i} main={artist} sub={trackNames} />;
                }
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
