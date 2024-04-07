export interface LikedSong {
    // if you change the key or value here, you need to update hello2.ts at the bottom, where the response is sent
    trackName: string
    artists: Artist[]
    added_at: string
}

export interface ExternalUrls {
    spotify: string;
}

export interface Followers {
    href: string | null;
    total: number;
}

export interface Artist {
    external_urls: ExternalUrls;
    followers: Followers;
    genres: string[];
    href: string;
    id: string;
    images?: Image[];
    name: string;
    popularity: number;
    type: string;
    uri: string;
    isFollowing?: boolean
}

export interface Image {
    height: number;
    url: string;
    width: number;
}

export interface Album {
    album_type: string;
    artists: Artist[];
    available_markets: string[];
    external_urls: ExternalUrls;
    href: string;
    id: string;
    images: Image[];
    name: string;
    release_date: string;
    release_date_precision: string;
    total_tracks: number;
    type: string;
    uri: string;
}

export interface ExternalIds {
    isrc: string;
}

export interface Track {
    album: Album;
    artists: Artist[];
    available_markets: string[];
    disc_number: number;
    duration_ms: number;
    explicit: boolean;
    external_ids: ExternalIds;
    external_urls: ExternalUrls;
    href: string;
    id: string;
    is_local: boolean;
    name: string;
    popularity: number;
    preview_url: string | null;
    track_number: number;
    type: string;
    uri: string;
}

export interface Item {
    added_at: string;
    track: Track;
}

export interface Paging {
    href: string;
    items: Item[];
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
}

// const jsonResponse: Paging = {
//     href: "https://api.spotify.com/v1/me/tracks?offset=0&limit=3",
//     items: [
//         {
//             added_at: "2024-03-06T07:36:27Z",
//             track: {
//                 // ... Track details
//             }
//         },
//         // ... Additional items
//     ],
//     limit: 3,
//     next: "https://api.spotify.com/v1/me/tracks?offset=3&limit=3",
//     offset: 0,
//     previous: null,
//     total: 528
// };
