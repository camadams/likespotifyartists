import { TrackNameAndArtists } from "./utils/types";

export default function TrackNameAndArtistsElement(track: TrackNameAndArtists) {
  return (
    <div>
      <h1 className="">{track.trackName}</h1>
      <div>
        <div className="pl-10 ">
          {track.artists?.map((artist, i) => (
            <div key={i} className="flex space-y-1">
              <h1 className="text-yellow-500 w-1/2">{artist.name}</h1>
              <FollowingNotFollowingButton {...{ artistId, green }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
