# `v6.db.transport.rest` documentation

[`v6.db.transport.rest`](https://v6.db.transport.rest/) is a [REST API](https://restfulapi.net) for the public transportation system in Germany.

The [DB HAFAS API is currently not available](https://github.com/public-transport/hafas-client/issues/331), and it seems like it has been shut off permanently. `db-rest` now uses [`db-vendo-client`](https://github.com/public-transport/db-vendo-client) as a backend. It covers most of the use cases served by `db-rest`, notably except for `/stops/reachable-from` and `/radar`. Please also note some further limitations and caveats over in the readme and documentation of [`db-vendo-client`](https://github.com/public-transport/db-vendo-client). Also, [the underlying APIs seem to have a **much lower rate limit**](https://github.com/public-transport/db-vendo-client/issues/10). ⚠️ Hence, make sure [that you cannot obtain the data needed for your use case in a more efficient manner, e.g. using the available GTFS feeds](#why-not-to-use-this-api).

[![API status](https://badgen.net/uptime-robot/status/m793274556-25c5e9bbab0297d91cda7134)](https://stats.uptimerobot.com/57wNLs39M/793274556)

## How it works

Because it wraps [an API](https://github.com/public-transport/db-vendo-client/blob/main/docs/db-apis.md) of [Deutsche Bahn](https://de.wikipedia.org/wiki/Deutsche_Bahn), it **includes most of the long-distance and regional traffic, as well as some international trains and local buses**. Essentially, it returns whatever data the [*DB Navigator* app](https://www.bahn.de/p/view/service/mobile/db-navigator.shtml) shows*, **including realtime delays and disruptions**.

*When comparing results from this API to what the DB Navigator app shows there might be occasional differences due to them utilizing different, not 100% identical backends.* 

- [Getting Started](getting-started.md)
- [API documentation](api.md) (run `npm run build` to generate)
- [OpenAPI playground with API documentation](https://petstore.swagger.io/?url=https%3A%2F%2Fv6.db.transport.rest%2F.well-known%2Fservice-desc%0A)

By default, the `dbnav` profile of [db-vendo-client](https://github.com/public-transport/db-vendo-client) will be used. On all endpoints, you can use the `profile` URL parameter to change to a different profile, e.g. `profile=db` or `profile=dbweb`. As per [db-vendo-client](https://github.com/public-transport/db-vendo-client)'s documentation, this will have an impact on returned details, parameter limits and quotas.

## Why not to use this API?

### Low rate limits

[The underlying APIs seem to have a **much lower rate limit**](https://github.com/public-transport/db-vendo-client/issues/10) than before, i.e. you should not use this service to send many requests in an automated manner. Instead, you may:

### Use GTFS and GTFS-RT

[GTFS](https://gtfs.org) and [GTFS-RT](https://gtfs.org/documentation/realtime/reference/) are file format/feed specifications for scheduled timetables and realtime updates like delays, respectively. They enable you to download datasets for entire transport associations, regions or even countries in one go, for local querying (e.g. with [MOTIS](https://github.com/motis-project/motis) or [OTP](https://github.com/opentripplanner/OpenTripPlanner/)) and analysis (e.g. with [gtfs-via-postgres](https://github.com/public-transport/gtfs-via-postgres) and [print-gtfs-rt-cli](https://github.com/derhuerst/print-gtfs-rt-cli)). For Germany, [GTFS](https://www.opendata-oepnv.de/ht/de/organisation/delfi/startseite?tx_vrrkit_view%5Baction%5D=details&tx_vrrkit_view%5Bcontroller%5D=View&tx_vrrkit_view%5Bdataset_name%5D=deutschlandweite-sollfahrplandaten-gtfs&cHash=af4be4c0a9de59953fb9ee2325ef818f) and [GTFS-RT](https://mobilithek.info/offers/755009281410899968) feeds are provided by [DELFI e.V.](https://www.delfi.de/) Refined, publicly available feeds based on these and other sources can be obtained from [gtfs.de](https://gtfs.de) and [stc.traines.eu](https://stc.traines.eu/mirror/). I.e. by using these you do not need to make any excessive API requests, however, the data quality and coverage of these feeds will currently in many cases still be inferior to what is provided by Deutsche Bahn.

### Use other APIs

[transitous.org](https://transitous.org) may be another option, even with worldwide coverage based on GTFS/RT-feeds, however, as with any other APIs, it should not be flooded with requests. If only data on trains is needed (no buses, trams etc.), [DB (I)RIS-based APIs](https://developers.deutschebahn.com/db-api-marketplace/apis/product/timetables) may also be of interest.

### Run your own instance of this API

It may help to distribute the load by running your own instance of `db-rest`/[`db-vendo-client`](https://github.com/public-transport/db-vendo-client/). Both provide Dockerfiles/Docker images for easy setup of the REST API server. `db-rest` additionally includes a caching layer (if configured correctly), serves the OpenAPI specification, and does some more plumbing.

## Why use this API?

### Realtime Data

This API returns realtime data whenever it is available upstream, as the API for DB's mobile app provides it.

*Note: Different endpoints might remove realtime data like delays and cancellations at different times, i.e. after a journey's arrival.*

### No API Key

You can just use the API without authentication. There's a [rate limit](https://apisyouwonthate.com/blog/what-is-api-rate-limiting-all-about) of 100 requests/minute set up.

### CORS

This API has [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS) enabled, so you can query it from any webpage.

### Caching-friendly

This API sends [`ETag`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag) & [`Cache-Control`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control) headers, allowing clients cache responses properly.
