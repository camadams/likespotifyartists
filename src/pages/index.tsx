import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Link from "next/link";
import { Artist, LikedSong } from "~/utils/types";
import { LoadingSpinner } from "~/LoadingSpinner";
import Image from "next/image";
import { format, formatDistance, isBefore, subMonths } from "date-fns";

type HelloResponse = {
  likedSongs: LikedSong[];
  accessToken: string;
};

export default function Home() {
  const [likedTracks, setLikedSongs] = useState<LikedSong[]>([]);
  const [accessToken, setAccessToken] = useState<string>();
  const [loadingLikedTracks, setLoadingLikedTracks] = useState<boolean>(false);
  const [following, setFollowingArtitstIds] = useState<string[]>([]);
  const [allArtistsCount, setAllArtistsCount] = useState<number>(1);
  const [toFollow, setToFollow] = useState<string[]>([]);
  const [toUnfollow, setToUnfollow] = useState<string[]>([]);
  const [groupById, setGroupById] = useState(0);

  const router = useRouter();

  useEffect(() => {
    const { code, accessToken } = router.query;
    if (code && likedTracks.length == 0) {
      const doStuff = async () => {
        setLoadingLikedTracks(() => true);

        var url = `${
          process.env.NODE_ENV === "development"
            ? "https://localhost:3000"
            : "https://likeartists.vercel.app"
        }`;
        await axios
          .post(`${url}/api/hello2`, {
            code: code,
            accessToken: accessToken,
          })
          .then((response) => {
            var responseData = response.data as HelloResponse;
            setLikedSongs(() => responseData.likedSongs);
            setFollowingArtitstIds(() =>
              Array.from(
                new Set(
                  responseData.likedSongs.flatMap((song) =>
                    [...song.artists]
                      .filter((artist) => artist.isFollowing)
                      .map((artist) => artist.id)
                  )
                )
              )
            );
            setAllArtistsCount(() => {
              const uniqueArtists = Array.from(
                new Set(
                  responseData.likedSongs
                    .flatMap((song) => [...song.artists])
                    .map((artist) => artist.id)
                )
              );
              return uniqueArtists.length;
            });
            setAccessToken(() => responseData.accessToken);
            router.push({
              pathname: router.pathname,
              query: { code, accessToken: responseData.accessToken },
            });
            setLoadingLikedTracks(() => false);
          })
          .catch((error) => alert("&&& Error: " + error.message));
      };
      doStuff();
    }
  }, [likedTracks.length, router, router.query, router.query.code]);

  const handelLoggedInClicked = () => {
    setLoadingLikedTracks(() => true);
  };

  const handleFollow = async (artistId: string) => {
    if (following.includes(artistId)) {
      if (toUnfollow.includes(artistId)) {
        // means we revert unfollow
        setToUnfollow((prev) => prev.filter((x) => x !== artistId));
      } else {
        // means we must unfollow
        setToUnfollow((prev) => [...prev, artistId]);
      }
    } else {
      if (toFollow.includes(artistId)) {
        // means we revert follow
        setToFollow((prev) => prev.filter((x) => x !== artistId));
      } else {
        // means we must follow
        setToFollow((prev) => [...prev, artistId]);
      }
    }
    return;
  };

  const handleSave = async () => {
    var url = `${
      process.env.NODE_ENV === "development"
        ? "https://localhost:3000"
        : "https://likeartists.vercel.app"
    }`;

    await axios
      .put(`${url}/api/follow`, {
        toFollow: toFollow,
        toUnfollow: toUnfollow,
        accessToken,
      })
      .then(() => {
        setFollowingArtitstIds((prev) => [...prev, ...toFollow]);
        toFollow.forEach((x) => {
          likedTracks.forEach((y) => {
            const artist = y.artists.find((artist) => artist.id === x);
            if (artist) {
              artist.isFollowing = true;
            }
          });
        });
        setToFollow(() => []);
        setFollowingArtitstIds((prev) =>
          prev.filter((x) => !toUnfollow.includes(x))
        );
        toUnfollow.forEach((x) => {
          likedTracks.forEach((y) => {
            const artist = y.artists.find((artist) => artist.id === x);
            if (artist) {
              artist.isFollowing = false;
            }
          });
        });
        setToUnfollow(() => []);
      })
      .catch((err) => alert(err.message));
  };

  const doGroupingByArtist = (songs: LikedSong[]) => {
    const map = new Map<string, string[]>();
    songs.forEach(({ trackName, artists }) => {
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

  const handleFollowAll = () => {
    setToFollow(() =>
      Array.from(
        new Set(
          likedTracks.flatMap((x) =>
            [...x.artists]
              .filter(
                (artist) =>
                  !artist.isFollowing || !following.includes(artist.id)
              )
              .map((artist) => artist.id)
          )
        )
      )
    );
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
        className={`px-2 rounded-full text-xs py-1 font-semibold text-black ${
          green
            ? "bg-blue-500 hover:bg-blue-300"
            : "bg-yellow-500 hover:bg-yellow-300"
        } `}
      >
        {green ? "Following" : "Not Following"}
      </button>
    );
  };

  const SongCard = ({
    songName,
    artists,
    added_at,
  }: {
    songName: string;
    artists: Artist[];
    added_at: string;
  }) => {
    return (
      <div className="mb-3 hover:bg-gray-900">
        <div className="flex justify-between">
          <a className="font-semibold content-center  ">{songName}</a>
          <p className="text-xs content-center shrink-0 text-gray-300">
            {isBefore(added_at, subMonths(new Date(), 1))
              ? format(added_at, "d MMM yyyy")
              : formatDistance(added_at, new Date(), { addSuffix: true })}
            {/* {formatDistance(added_at, new Date(), { addSuffix: true })} */}
          </p>
        </div>
        <div className="pl-6">
          {artists.map((artist, index) => (
            <div key={index} className="flex justify-between mb-1 ">
              <div className="flex gap-3">
                <div className="shrink-0">
                  {!!artist.images && artist.images[0] && (
                    <Image
                      src={artist.images[0].url}
                      width={30}
                      height={30}
                      // width={main.images[0].width}
                      // height={main.images[0].height}
                      alt="artist image"
                    />
                  )}
                </div>
                <div className="">
                  <a
                    target="_blank"
                    href={artist.external_urls.spotify}
                    className="content-center text-sm text-yellow-500"
                  >
                    {artist.name}
                  </a>
                </div>
              </div>

              <div className="shrink-0">
                <FollowingNotFollowingButton
                  artistId={artist.id}
                  green={
                    !toUnfollow.includes(artist.id) &&
                    (following.includes(artist.id) ||
                      toFollow.includes(artist.id))
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ArtistCard = ({
    artist,
    songNames,
  }: {
    artist: Artist;
    songNames: string[];
  }) => {
    const maxVisableSongs = 3;
    return (
      <div className="flex justify-between mb-1 hover:bg-gray-900">
        <div className="flex gap-3">
          <div className="shrink-0">
            {!!artist.images && artist.images[0] && (
              <Image
                src={artist.images[0].url}
                width={40}
                height={40}
                // width={main.images[0].width}
                // height={main.images[0].height}
                alt="artist image"
              />
            )}
          </div>
          <div className="">
            <a
              target="_blank"
              href={artist.external_urls.spotify}
              className="font-semibold text-yellow-500 content-center"
            >
              {artist.name}
            </a>
            <p className="text-xs text-ellipsis">
              {songNames.slice(0, maxVisableSongs).join(", ")}
              {songNames.length > maxVisableSongs &&
                ` + ${songNames.length - maxVisableSongs} more`}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <FollowingNotFollowingButton
            artistId={artist.id}
            green={
              !toUnfollow.includes(artist.id) &&
              (following.includes(artist.id) || toFollow.includes(artist.id))
            }
          />
        </div>
      </div>
    );
  };

  {
    /* <div className="pl-4">
          {songNames.map((song, index) => (
            <div className="text-xs flex justify-between " key={index}>
              {song}
            </div>
          ))}
        </div> */
  }

  if (!router.query.code && likedTracks.length == 0) {
    return (
      <div className="flex h-screen items-center justify-center animate-in fade-in zoom-in">
        <Link
          className="rounded-full bg-sky-500 px-4 py-2 text-black"
          onClick={handelLoggedInClicked}
          href={"/api/login"}
        >
          Login with Spotify
        </Link>
      </div>
    );
  }

  if (loadingLikedTracks) {
    return (
      <div className="h-screen flex flex-row justify-center items-center animate-in fade-in zoom-in">
        <LoadingSpinner />
        <div className="text-sm">{`Loading your Liked Songs. It takes ~3s to load 500 songs`}</div>
      </div>
    );
  }

  return (
    <div className="container p-4 md:px-48 relative pb-10">
      {(toFollow.length > 0 || toUnfollow.length > 0) && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 h-10 text-center text-sm items-center animate-in fade-in zoom-in ">
          {toFollow.length > 0 && `Follow ${toFollow.length} artist(s). `}
          {toUnfollow.length > 0 && `Un-follow ${toUnfollow.length} artist(s)`}
          <button
            className="bg-blue-600 rounded-full px-2"
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

      {/* <div className="text-xs">
        {
          <div>
            {toFollow?.map((x, i) => (
              <div className="bg-blue-600" key={i}>
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
            className={`rounded-full px-2 border-pink-500 border-2 ${
              groupById == 1 ? "bg-pink-500" : ""
            }`}
            onClick={() => setGroupById(() => 1)}
          >
            Group by Track
          </button>
          <div className="p-2" />

          <p className="text-xs">{`You are following ${
            following.length
          }/${allArtistsCount} (${Math.round(
            ((following.length / allArtistsCount) * 100 * 100) / 100
          )}%) of the Arists in your Liked Songs Playlist`}</p>

          <div className="p-2 " />
          <div className="flex justify-end">
            <button
              className="rounded-full px-2 bg-gradient-to-r from-blue-500 to-orange-400  text-black hover:bg-orange-400"
              onClick={handleFollowAll}
            >
              Follow All
            </button>
          </div>

          {groupById == 1 ? (
            <div>
              {likedTracks?.map((track, i) => (
                <SongCard
                  key={i}
                  songName={track.trackName}
                  artists={track.artists}
                  added_at={track.added_at}
                />
              ))}
            </div>
          ) : (
            <div>
              {Array.from(doGroupingByArtist(likedTracks).entries()).map(
                ([artistId, trackNames], i) => {
                  var artist = getArtistNameFromId(artistId);
                  if (!artist) return;
                  return (
                    <ArtistCard
                      key={i}
                      artist={artist}
                      songNames={trackNames}
                    />
                  );
                }
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
