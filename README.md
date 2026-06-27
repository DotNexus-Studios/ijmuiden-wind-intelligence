# IJmuiden Wind Intelligence

Mobile-first wind and water-sport decision dashboard for IJmuiden, Netherlands.

## Development

```bash
npm install
npm run dev
```

## Deploy

Connect to Vercel or run `npx vercel`. Default region: `ams1`.

## Data

- RWS Waterwebservices for live wind (`src/lib/rws/`)
- Open-Meteo for HARMONIE, ECMWF, ICON-D2, GFS (`src/lib/weather-models/`)

RWS endpoints are isolated in `src/lib/constants.ts` for easy migration.
