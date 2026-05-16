# Tech Architecture

## Frontend
- Next.js App Router
- Server Components para data fetching
- Client Components para interacción

## Backend (Next API routes)
- /api/jikan -> proxy + cache
- /api/anime -> CRUD Firestore

## State
- Zustand para UI state (drawer, modal, edición)
- React Query opcional para sync

## Performance
- Virtualized table (react-virtual)
- Debounced autosave
