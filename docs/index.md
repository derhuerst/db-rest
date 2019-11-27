# [*Deutsche Bahn*](https://en.wikipedia.org/wiki/Deutsche_Bahn) Public Transport API

**The public endpoint is [`2.db.transport.rest`](`https://2.db.transport.rest`).** This API returns data in the [*Friendly Public Transport Format* `1.2.0`](https://github.com/public-transport/friendly-public-transport-format/blob/1.2.0/spec/readme.md).

*Note:* In order to improve this API, I would like to know which software projects use it. Please send an **`X-Identifier` header (e.g. `my-awesome-tool`) to let me know who you are**. I you don't provide it, a hash of the client IP will be logged.

## all routes

- [`GET /stations?query=…`](#get-stationsquery)
- [`GET /stations`](#get-stations)
- [`GET /stations/:id/departures`](#get-stationsiddepartures)
- [`GET /journeys`](#get-journeys)
- [`GET /journeys/:ref`](#get-journeysref)
- [`GET /trips/:id`](#get-tripsid)
- [`GET /locations`](#get-locations)

## `GET /stations?query=…`

Passes all parameters into [`db-stations-autocomplete`](https://github.com/derhuerst/db-stations-autocomplete).

- `query`: **Required.**
- `completion`: `true`/`false` – Default is `true`
- `fuzzy`: `true`/`false` – Default is `false`

`Content-Type`: `application/json`

### examples

```shell
curl 'https://2.db.transport.rest/stations?query=jungfernheide'
# note the typo
curl 'https://2.db.transport.rest/stations?query=jungfernhiede&fuzzy=true'
```


## `GET /stations`

Passes all parameters into [`db-stations`](https://github.com/derhuerst/db-stations).

- `id`: Filter by ID.
- `name`: Filter by name.
- `coordinates.latitude`: Filter by latitude.
- `coordinates.longitude`: Filter by longitude.
- `weight`: Filter by weight.

`Content-Type`: [`application/x-ndjson`](http://ndjson.org/)

### examples

```shell
curl 'https://2.db.transport.rest/stations?name=hannover&coordinates.latitude=52.3765387'
```


## `GET /stations/all`

Dumps `full.json` from [`vbb-stations`](https://github.com/derhuerst/vbb-stations).

`Content-Type`: `application/json`

### examples

```shell
curl 'https://2.db.transport.rest/stations/all'
```


## `GET /stations/:id/departures`

Returns departures at a station.

*Note:* As stated in the [*Friendly Public Transport Format* `1.2.0`](https://github.com/public-transport/friendly-public-transport-format/tree/1.2.0), the returned `departure` and `arrival` times include the current delay.

Passes all parameters into [`departures(…)` from `db-hafas`](https://github.com/derhuerst/db-hafas/blob/master/docs/departures.md).

- `when`: A [UNIX timestamp](https://en.wikipedia.org/wiki/Unix_time) or anything parsable by [`parse-messy-time`](https://github.com/substack/parse-messy-time#example). Default: now.
- `duration`: Show departures for the next `n` minutes. Default: `10`.

`Content-Type`: `application/json`

### examples

```shell
curl 'https://2.db.transport.rest/stations/008011160/departures?when=tomorrow%206pm'
```


## `GET /journeys`

Output from [`require('db-hafas').journeys(…)`](https://github.com/derhuerst/db-hafas#getting-started). Start location and end location must be either in [station format](#station-format) or in [POI/address format](#poiaddress-format) (you can mix them).

*Note:* As stated in the [*Friendly Public Transport Format* `1.2.0`](https://github.com/public-transport/friendly-public-transport-format/tree/1.2.0), the returned `departure` and `arrival` times include the current delay.

## station format

- `from`: **Required.** Station ID (e.g. `008011162`).
- `to`: **Required.** Station ID (e.g. `008011162`).

## POI format

- `from.latitude`/`to.latitude`: **Required.** Latitude (e.g. `52.543333`).
- `from.longitude`/`to.longitude`: **Required.** Longitude (e.g. `13.351686`).
- `from.name`/`to.name`: Name of the locality (e.g. `Atze Musiktheater`).
- `from.id`/`to.id`: **Required.** POI ID (e.g. `991598902`).

## address format

- `from.latitude`/`to.latitude`: **Required.** Latitude (e.g. `52.543333`).
- `from.longitude`/`to.longitude`: **Required.** Longitude (e.g. `13.351686`).
- `from.address`/`to.address`: **Required.** Address (e.g. `Voltastr. 17`).

## other parameters

- `departure`/`arrival`: A [UNIX timestamp](https://en.wikipedia.org/wiki/Unix_time) or anything parsable by [`parse-messy-time`](https://github.com/substack/parse-messy-time#example). Default: now. Use either `departure` or `arrival`.
- `earlierThan`: By passing an identifier from another query, get earlier journeys than before. Mutually exlusive with `laterThan`, `departure` & `arrival`.
- `laterThan`: By passing an identifier from another query, get later journeys than before. Mutually exclusive with `earlierThan`, `departure` & `arrival`.
- `results`: Maximum number of results. Default: `5`.
- `via`: Station ID. Default: `null`.
- `stopovers`: Return stations on the way? Default: `false`.
- `transfers`: Maximum number of transfers. Default: `5`.
- `transferTime`: Minimum time in minutes for a single transfer. Default: `0`.
- `accessibility`: Possible values: `partial`, `complete`. Default: `none`.
- `bike`: Return only bike-friendly journeys. Default: `false`.
- `tickets`: Return information about available tickets. Default: `false`.
- `language`: Language to get results in. Default: `en`.
- `polylines`: Return a shape for each leg? Default: `false`.
- `remarks`: Parse & expose hints & warnings? Default: `true`.
- `startWithWalking`: Consider walking to nearby stations at the beginning of a journey? Default: `true`.
- `scheduledDays`: Parse which days each journey is valid on? Default: `false`.

You can filter by means of transportation using these parameters:

- `taxi`: Include taxis? Default: `false`.
- `tram`: Include [trams](https://en.wikipedia.org/wiki/Tram)? Default: `true`.
- `ferry`: Include [ferries](https://en.wikipedia.org/wiki/Ferry)? Default: `true`.
- `bus`: Include [buses](https://en.wikipedia.org/wiki/Bus)? Default: `true`.
- `subway`: Include [U-Bahn trains](https://en.wikipedia.org/wiki/Rapid_transit)? Default: `true`.
- `suburban`: Include [S-Bahn trains](https://en.wikipedia.org/wiki/S-train)? Default: `true`.
- `regional`: Include RB/ODEG trains? Default: `true`.
- `regionalExp`: Include RE/ODEG trains? Default: `true`.
- `national`: Include [IC/EC trains](https://en.wikipedia.org/wiki/Intercity_(Deutsche_Bahn)? Default: `true`.
- `nationalExp`: Include [ICE trains](https://en.wikipedia.org/wiki/Intercity-Express)? Default: `true`.

`Content-Type`: `application/json`

### examples

```shell
curl 'https://2.db.transport.rest/journeys?from=008011162&to=008000281'
curl 'https://2.db.transport.rest/journeys?from=008004158&to.id=991598902&to.name=Atze%20Musiktheater&to.latitude=52.543333&to.longitude=13.351686'
curl 'https://2.db.transport.rest/journeys?from=…&to=…&results=3&bus=false&tickets=true'
```


## `GET /journeys/:ref`

Output from [`hafas.refreshJourney(…)`](https://github.com/public-transport/hafas-client/blob/4/docs/refresh-journey.md).

- `stopovers`: Return stations on the way? Default: `false`.
- `polylines`: Return shape of each journey leg? Default: `false`.
- `remarks`: Parse & expose hints & warnings? Default: `true`.
- `language`: Language of the results. Default: `en`.

`Content-Type`: `application/json`

### examples

```shell
curl 'https://2.db.transport.rest/journeys/%C2%B6HKI%C2%B6T%24A%3D1%40O%3DBerlin%20Hbf%20(tief)%40L%3D8098160%40a%3D128%40%24A%3D1%40O%3DHamburg%20Hbf%40L%3D8002549%40a%3D128%40%24201910062138%24201910062333%24ICE%20%20502%24%241%24%C2%A7T%24A%3D1%40O%3DHamburg%20Hbf%40L%3D8002549%40a%3D128%40%24A%3D1%40O%3DMannheim%20Hbf%40L%3D8000244%40a%3D128%40%24201910062345%24201910070625%24ICE%201271%24%241%24%C2%A7T%24A%3D1%40O%3DMannheim%20Hbf%40L%3D8000244%40a%3D128%40%24A%3D1%40O%3DStuttgart%20Hbf%40L%3D8000096%40a%3D128%40%24201910070629%24201910070707%24ICE%20%20991%24%241%24%C2%A7T%24A%3D1%40O%3DStuttgart%20Hbf%40L%3D8000096%40a%3D128%40%24A%3D1%40O%3DT%C3%BCbingen%20Hbf%40L%3D8000141%40a%3D128%40%24201910070722%24201910070823%24RE%2022011%24%241%24%0A'
```


## `GET /trips/:id`

Output from [`hafas.trip(…)`](https://github.com/public-transport/hafas-client/blob/4/docs/trip.md).

- `lineName`: **Required.** Line name of the part's mode of transport, e.g. `RE 7`.
- `stopovers`: Return stations on the way? Default: `true`.
- `remarks`: Parse & expose hints & warnings? Default: `true`.
- `polyline`: Return a shape for the trip? Default: `false`.
- `language`: Language of the results. Default: `en`.

`Content-Type`: `application/json`

### examples

```shell
curl 'https://your-api-endpoint/trips/1|229086|0|80|6102019?lineName=ICE+993'
```


## `GET /locations`

Output from [`require('db-hafas').locations(…)`](https://github.com/derhuerst/db-hafas/blob/master/docs/locations.md)

- `query`: **Required.** (e.g. `Alexanderplatz`)
- `results`: How many stations shall be shown? Default: `10`.
- `stations`: Show stations? Default: `true`.
- `poi`: Show points of interest? Default: `true`.
- `addresses`: Show addresses? Default: `true`.

`Content-Type`: `application/json`

### examples

```shell
curl 'https://2.db.transport.rest/locations?query=Alexanderplatz'
curl 'https://2.db.transport.rest/locations?query=Pestalozzistra%C3%9Fe%2082%2C%20Berlin&poi=false&stations=false'
```


## `GET /radar`

- `north`: **Required.** Northern latitude.
- `west`: **Required.** Western longtidue.
- `south`: **Required.** Southern latitude.
- `east`: **Required.** Eastern longtidue.
- `results`: How many vehicles shall be shown? Default: `256`.
- `duration`: Compute frames for how many seconds? Default: `30`.
- `frames`: Number of frames to compute. Default: `3`.

`Content-Type`: `application/json`

### examples

```shell
curl 'https://2.db.transport.rest/radar?north=52.52411&west=13.41002&south=52.51942&east=13.41709'
```
