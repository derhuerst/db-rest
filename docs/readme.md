# `v6.db.transport.rest` documentation

[`v6.db.transport.rest`](https://v6.db.transport.rest/) is a [REST API](https://restfulapi.net) for the public transportation system in Germany.

[![API status](https://badgen.net/uptime-robot/status/m793274556-25c5e9bbab0297d91cda7134)](https://stats.uptimerobot.com/57wNLs39M/793274556)

Because it wraps [an API](https://github.com/public-transport/hafas-client/blob/6/readme.md#background) of [Deutsche Bahn](https://de.wikipedia.org/wiki/Deutsche_Bahn), it **includes most of the long-distance and regional traffic, as well as some international trains and local buses**. Essentially, it returns whatever data the [*DB Navigator* app](https://www.bahn.de/p/view/service/mobile/db-navigator.shtml) shows*, **including realtime delays and disruptions**.

*When comparing results from this API to what the DB Navigator app shows there might be occasional differences due to them utilizing different, not 100% identical backends.*

- [Getting Started](getting-started.md)
- [API documentation](api.md) (run `npm run build` to generate)
- [OpenAPI playground with API documentation](https://petstore.swagger.io/?url=https%3A%2F%2Fv6.db.transport.rest%2F.well-known%2Fservice-desc%0A)

## Why use this API?

### Realtime Data

This API returns realtime data whenever it is upstream. The [API for DB's mobile app](https://github.com/public-transport/hafas-client/blob/6/p/db/readme.md) provides it.

*Note: Different endpoints might remove realtime data like delays and cancellations at different times, i.e. after a journey's arrival.*

### No API Key

You can just use the API without authentication. There's a [rate limit](https://apisyouwonthate.com/blog/what-is-api-rate-limiting-all-about) of 100 requests/minute set up.

### CORS

This API has [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS) enabled, so you can query it from any webpage.

### Caching-friendly

This API sends [`ETag`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag) & [`Cache-Control`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control) headers, allowing clients cache responses properly.
