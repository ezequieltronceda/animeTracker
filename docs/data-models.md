# Data Models

## Season
{
  id: string,
  name: string,
  createdAt: timestamp
}

## Anime
{
  id: string,
  malId: number,
  jkanimeUrl: string,
  day: string,
  order: number,
  users: {
    eze: UserData,
    pancho: UserData
  }
}

## UserData
{
  status: string,
  episodesWatched: number[],
  opinion?: string
}
