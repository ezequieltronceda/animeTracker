export type UserStatus = 
  | 'viendo'
  | 'en_pausa'
  | 'terminado'
  | 'pendiente'
  | 'dropeado'
  | 'ni_en_un_millon';

export interface UserData {
  status: UserStatus;
  episodesWatched: number[];
  opinion?: string;
}

export interface Anime {
  id: string;
  seasonId: string;
  malId: number;
  jikanUrl?: string | null;
  title: string;
  titleJp?: string | null;
  imageUrl?: string | null;
  day?: string;
  order: number;
  episodes: number;
  maxEpisodes?: number;
  score?: number;
  synopsis?: string | null;
  genres?: string[];
  seiyuus?: SeiyuuId[];
  users: {
    eze: UserData;
    pancho: UserData;
  };
}

export interface Season {
  id: string;
  name: string;
  createdAt?: Date;
}

export interface SeasonWithAnime extends Season {
  animeCount?: number;
}

export type User = 'eze' | 'pancho';

export type SeiyuuId = 'koyasu' | 'hanazawa';