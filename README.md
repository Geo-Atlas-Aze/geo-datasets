# GeoAtlas Datasets

Official dataset repository for [Geo-Atlas-Aze](https://github.com/Geo-Atlas-Aze).

Published releases are consumed via jsDelivr.

## Dataset V2 (current)

Immutable releases under `v2/{country}/{contentVersion}/`:

`https://cdn.jsdelivr.net/gh/Geo-Atlas-Aze/geo-datasets@main/v2/az/2.0.0/`

| File | Purpose |
|------|---------|
| `manifest.json` | Release identity, artifact/chunk inventory |
| `checksums.json` | SHA-256 for every artifact file |
| `search/` | Published search family |
| `analytics/` | Published analytics family |
| `indexes/` | Chunk index |

**Not published (Track 2):** `entities/`, `classifications/`.

### Azerbaijan `2.0.0`

- Country: `az`
- Content version: `2.0.0`
- Families: search, analytics, indexes
- Source: production OSM/Overpass pipeline (`geo-data-generator` `build az --skip-roads`)

## Dataset V1 (legacy)

`https://cdn.jsdelivr.net/gh/Geo-Atlas-Aze/geo-datasets@main/az/v1.0.0/`
