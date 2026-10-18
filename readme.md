# db-rest

__This API is not operational anymore. You may try running your own instance or switching to an alternative:__

## Why not to use this API?

### Low rate limits

[The underlying APIs seem to have a **much lower rate limit**](https://github.com/public-transport/db-vendo-client/issues/10) than before, i.e. you should not use this service to send many requests in an automated manner. Instead, you may:

### Use GTFS and GTFS-RT and other datasets

[GTFS](https://gtfs.org) and [GTFS-RT](https://gtfs.org/documentation/realtime/reference/) are file format/feed specifications for scheduled timetables and realtime updates like delays, respectively. They enable you to download datasets for entire transport associations, regions or even countries in one go, for local querying (e.g. with [MOTIS](https://github.com/motis-project/motis) and [motis-fptf-client](https://github.com/motis-project/motis-fptf-client) or [OTP](https://github.com/opentripplanner/OpenTripPlanner/)) and analysis (e.g. with [gtfs-via-postgres](https://github.com/public-transport/gtfs-via-postgres) and [print-gtfs-rt-cli](https://github.com/derhuerst/print-gtfs-rt-cli)). For Germany, [GTFS](https://www.opendata-oepnv.de/ht/de/organisation/delfi/startseite?tx_vrrkit_view%5Baction%5D=details&tx_vrrkit_view%5Bcontroller%5D=View&tx_vrrkit_view%5Bdataset_name%5D=deutschlandweite-sollfahrplandaten-gtfs&cHash=af4be4c0a9de59953fb9ee2325ef818f) and [GTFS-RT](https://mobilithek.info/offers/755009281410899968) feeds are provided by [DELFI e.V.](https://www.delfi.de/) Refined, publicly available feeds based on these and other sources can be obtained [via Transitous](https://github.com/public-transport/transitous/blob/main/feeds/de.json#L18-L61) or from [gtfs.de](https://gtfs.de). I.e. by using these you do not need to make any excessive API requests, however, the data quality and coverage of these feeds will currently in many cases still be inferior to what is provided by Deutsche Bahn.

If you're just interested in stops/autocompletion:

* [db-hafas-stations](https://github.com/derhuerst/db-hafas-stations)
* [ZHV Haltestellenregister](https://zhv.wvigmbh.de/)

### Use other APIs

* [transitous.org](https://transitous.org) even with worldwide coverage based on GTFS/RT-feeds, however, as with any other APIs, [it should not be flooded with requests](https://transitous.org/api/). To ease migration from `db-rest`, it can be used in conjunction with [motis-fptf-client](https://github.com/motis-project/motis-fptf-client)
* [DB (I)RIS-based APIs](https://developers.deutschebahn.com/db-api-marketplace/apis/product/timetables), if only data on trains is needed (no buses, trams etc.)
* [hafas-client](https://github.com/public-transport/hafas-client) with the OEBB profile should also at least contain trains in Germany

### Run your own instance of this API

It may help to distribute the load by running your own instance of `db-rest`/[`db-vendo-client`](https://github.com/public-transport/db-vendo-client/). Both provide Dockerfiles/Docker images for easy setup of the REST API server. `db-rest` additionally includes a caching layer (if configured correctly), serves the OpenAPI specification, and does some more plumbing.

## Using this API

**A clean REST API wrapping around the [Deutsche Bahn HAFAS API](https://github.com/public-transport/db-hafas#db-hafas).** It is deployed at [`v6.db.transport.rest`](https://v6.db.transport.rest/).

[**API Documentation**](docs/readme.md)

> [!IMPORTANT]
> The [DB HAFAS API is currently not available](https://github.com/public-transport/hafas-client/issues/331), and it seems like it has been shut off permanently.
>
> **This wrapper API now uses [`db-vendo-client`](https://github.com/public-transport/db-vendo-client) as a backend, which covers most of the use cases**, notably except for `/stops/reachable-from` and `/radar`. Please also note some further limitations and caveats in the readme and documentation of [`db-vendo-client`](https://github.com/public-transport/db-vendo-client).
>
> Also, the new [underlying APIs seem to have a **much lower rate limit** than the old HAFAS API](https://github.com/public-transport/db-vendo-client/issues/10). ⚠️ Hence, please check if you [can obtain the data needed for your use case in a more efficient manner](docs/readme.md#why-not-to-use-this-api), e.g. by using the available GTFS feeds.

![db-rest architecture diagram](architecture.svg)

[![API status](https://badgen.net/uptime-robot/status/m793274556-25c5e9bbab0297d91cda7134)](https://stats.uptimerobot.com/57wNLs39M/793274556)
[![dependency status](https://img.shields.io/david/derhuerst/db-rest.svg)](https://david-dm.org/derhuerst/db-rest)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/db-rest.svg)
[![support me via GitHub Sponsors](https://img.shields.io/badge/support%20me-donate-fa7664.svg)](https://github.com/sponsors/derhuerst)
[![chat with me on Twitter](https://img.shields.io/badge/chat%20with%20me-on%20Twitter-1da1f2.svg)](https://twitter.com/derhuerst)


## installing & running

### access to Redis

It is recommended that you let `bvg-rest` cache HAFAS responses within a [Redis](https://redis.io/) cache. To use this feature, set `$REDIS_URL` (e.g. to `redis://localhost:6379/1` when running Redis locally).

### via Docker

A Docker image [is available as `docker.io/derhuerst/db-rest:6`](https://hub.docker.com/r/docker.io/derhuerst/db-rest:6).

```shell
docker run -d -p 3000:3000 docker.io/derhuerst/db-rest:6
```

*Note:* The Docker image does not contain the Redis server.

### manually

```shell
git clone https://github.com/derhuerst/db-rest.git
cd db-rest
git checkout 6
npm install

export HOSTNAME='my-vbb-rest-api.example.org'
npm run build

redis-server &
npm start
```

To keep the API running permanently, use tools like [`forever`](https://github.com/foreverjs/forever#forever) or [`systemd`](https://wiki.debian.org/systemd).


## Related Projects

- [`DB-Adapter-v6`](https://github.com/olech2412/DB-Adapter-v6) – A Java API client for `db-rest`.
- [`vbb-rest`](https://github.com/derhuerst/vbb-rest) – A clean REST API wrapping around the VBB API.
- [`bvg-rest`](https://github.com/derhuerst/bvg-rest) – A clean REST API wrapping around the BVG API.
- [`hvv-rest`](https://github.com/derhuerst/hvv-rest) – A clean REST API wrapping around the HVV API.
- [`hafas-rest-api`](https://github.com/public-transport/hafas-rest-api) – Expose a HAFAS client via an HTTP REST API.
- [`hafas-client`](https://github.com/public-transport/hafas-client) – JavaScript client for HAFAS public transport APIs.


## Contributing

If you **have a question**, **found a bug** or want to **propose a feature**, have a look at [the issues page](https://github.com/derhuerst/db-rest/issues).
