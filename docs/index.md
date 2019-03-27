# [*Deutsche Bahn*](https://en.wikipedia.org/wiki/Deutsche_Bahn) Public Transport API

**The public endpoint is [`2.db.transport.rest`](`https://2.db.transport.rest`).** This API returns data in the [*Friendly Public Transport Format* `1.2.1`](https://github.com/public-transport/friendly-public-transport-format/blob/1.2.1/spec/readme.md).

*Note:* In order to improve this API, I would like to know which software projects use it. Please send an **`X-Identifier` header (e.g. `my-awesome-tool`) to let me know who you are**. I you don't provide it, a hash of the client IP will be logged.

## all routes

- [`GET /stops/nearby`](#get-stopsnearby)
- [`GET /stops/:id`](#get-stopsid)
- [`GET /stops/:id/departures`](#get-stopsiddepartures)
- [`GET /journeys`](#get-journeys)
- [`GET /journeys/:ref`](#get-journeysref)
- [`GET /trips/:id`](#get-tripsid)
- [`GET /locations`](#get-locations)

- [`GET /stations?query=…`](#get-stationsquery)
- [`GET /stations`](#get-stations)
- [`GET /stations/:id/departures`](#get-stationsiddepartures)

## `GET /stops/nearby`

- `latitude`: **Required.**
- `longitude`: **Required.**
- `results`: How many stops/stations shall be shown? Default: `8`.
- `distance`: Maximum distance in meters. Default: `null`.
- `stops`: Show stops/stations around. Default: `true`.
- `poi`: Show points of interest around. Default: `false`.
- `linesOfStops`: Parse & expose lines of each stop/station? Default: `false`.
- `language`: Language of the results. Default: `en`.

`Content-Type`: `application/json`

### examples

```shell
curl 'https://2.db.transport.rest/stops/nearby?latitude=52.52725&longitude=13.4123'
```


## `GET /stops/:id`

`Content-Type`: `application/json`

- `linesOfStops`: Parse & expose lines of the stop/station? Default: `false`.
- `language`: Language of the results. Default: `en`.

### examples

```shell
curl 'https://2.db.transport.rest/stops/900000013102'
```


## `GET /stops/:id/departures`

Returns departures at a stop/station.

*Note:* As stated in the [*Friendly Public Transport Format* `1.2.1`](https://github.com/public-transport/friendly-public-transport-format/blob/1.2.1/spec/readme.md), the returned `departure` and `arrival` times include the current delay.

`Content-Type`: `application/json`

- `when`: A [UNIX timestamp](https://en.wikipedia.org/wiki/Unix_time) or anything parsable by [`parse-messy-time`](https://github.com/substack/parse-messy-time#example). Default: now.
- `direction`: Filter departures by direction. Default: `null`.
- `duration`: Show departures for the next `n` minutes. Default: `10`.
- `linesOfStops`: Parse & expose lines of each stop/station? Default: `false`.
- `remarks`: Parse & expose hints & warnings? Default: `true`.
- `includeRelatedStations`: Fetch departures at related stations, e.g. those that belong together on the metro map? Default: `true`.
- `language`: Language of the results. Default: `en`.

### examples

```shell
# at U Kottbusser Tor, in direction U Görlitzer Bahnhof
curl 'https://2.db.transport.rest/stops/900000013102/departures?direction=900000014101&duration=10'
# at U Kottbusser Tor, without direction
curl 'https://2.db.transport.rest/stops/900000013102/departures?when=tomorrow%206pm'
```


## `GET /journeys`

Output from [`hafas.journeys(…)`](https://github.com/public-transport/hafas-client/blob/4/docs/journeys.md). Start location and end location must be either in [stop format](#stop-format), [POI format](#poi-format) or [address format](#address-format) (you can mix them).

*Note:* As stated in the [*Friendly Public Transport Format* `1.2.1`](https://github.com/public-transport/friendly-public-transport-format/blob/1.2.1/spec/readme.md), the returned `departure` and `arrival` times include the current delay.

## stop format

- `from`: **Required.** stop/station ID (e.g. `900000023201`).
- `to`: **Required.** stop/station ID (e.g. `900000023201`).

## POI format

- `from.latitude`/`to.latitude`: **Required.** Latitude (e.g. `52.543333`).
- `from.longitude`/`to.longitude`: **Required.** Longitude (e.g. `13.351686`).
- `from.name`/`to.name`: Name of the locality (e.g. `Atze Musiktheater`).
- `from.id`/`to.id`: **Required.** POI ID (e.g. `9980720`).

## address format

- `from.latitude`/`to.latitude`: **Required.** Latitude (e.g. `52.543333`).
- `from.longitude`/`to.longitude`: **Required.** Longitude (e.g. `13.351686`).
- `from.address`/`to.address`: **Required.** Address (e.g. `Voltastr. 17`).

## other parameters

- `departure` or `arrival`: A [UNIX timestamp](https://en.wikipedia.org/wiki/Unix_time) or anything parsable by [`parse-messy-time`](https://github.com/substack/parse-messy-time#example). Default: now.
- `results`: Maximum number of results. Default: `5`.
- `via`: stop/station ID. Default: `null`.
- `stopovers`: Return stops/stations on the way? Default: `false`.
- `transfers`: Maximum number of transfers. Default: `null`.
- `transferTime`: Minimum time in minutes for a single transfer. Default: `0`.
- `accessibility`: Possible values: `partial`, `complete`. Default: `none`.
- `bike`: Return only bike-friendly journeys. Default: `false`.
- `tickets`: Return information about available tickets. Default: `false`.
- `polylines`: Return shape of each journey leg? Default: `false`.
- `remarks`: Parse & expose hints & warnings? Default: `true`.
- `startWithWalking`: Consider walking to nearby stations at the beginning of a journey? Default: `true`.
- `language`: Language of the results. Default: `en`.

- `suburban`: Include [S-Bahn trains](https://en.wikipedia.org/wiki/Berlin_S-Bahn)? Default: `true`.
- `subway`: Include [U-Bahn trains](https://en.wikipedia.org/wiki/Berlin_U-Bahn)? Default: `true`.
- `tram`: Include [trams](https://en.wikipedia.org/wiki/Trams_in_Berlin)? Default: `true`.
- `bus`: Include [buses](https://en.wikipedia.org/wiki/Bus_transport_in_Berlin)? Default: `true`.
- `ferry`: Include [ferries](https://en.wikipedia.org/wiki/Ferry_transport_in_Berlin)? Default: `true`.
- `express`: Include [IC/ICE/EC trains](https://en.wikipedia.org/wiki/High-speed_rail_in_Germany)? Default: `true`.
- `regional`: Include [RE/RB/ODEG trains](https://de.wikipedia.org/wiki/Liste_der_Eisenbahnlinien_in_Brandenburg_und_Berlin#Regionalverkehr)? Default: `true`.

`Content-Type`: `application/json`

### examples

```shell
curl 'https://2.db.transport.rest/journeys?from=900000017104&to=900000017101'
curl 'https://2.db.transport.rest/journeys?from=900000023201&to.name=ATZE%20Musiktheater&to.latitude=52.543333&to.longitude=13.351686'
curl 'https://2.db.transport.rest/journeys?from=…&to=…&results=3&bus=false&tickets=true'
```


## `GET /journeys/:ref`

Output from [`hafas.refreshJourney(…)`](https://github.com/public-transport/hafas-client/blob/4/docs/refresh-journey.md).

- `stopovers`: Return stations on the way? Default: `true`.
- `polylines`: Return shape of each journey leg? Default: `false`.
- `remarks`: Parse & expose hints & warnings? Default: `true`.
- `language`: Language of the results. Default: `en`.

`Content-Type`: `application/json`

### examples

```shell
curl 'https://2.db.transport.rest/journeys/T%24A%3D1%40O%3DS%2BU%20Westhafen%20(Berlin)%40L%3D900001201%40a%3D128%40%24A%3D1%40O%3DS%2BU%20Gesundbrunnen%20Bhf%20(Berlin)%40L%3D900007102%40a%3D128%40%24201808061945%24201808061950%24%20%20%20%20%20S41%24%0A'
```


## `GET /trips/:id`

Output from [`hafas.trip(…)`](https://github.com/public-transport/hafas-client/blob/4/docs/trip.md).

- `lineName`: **Required.** Line name of the part's mode of transport, e.g. `RE7`.
- `stopovers`: Return stations on the way? Default: `true`.
- `remarks`: Parse & expose hints & warnings? Default: `true`.
- `polyline`: Return a shape for the trip? Default: `false`.
- `language`: Language of the results. Default: `en`.

`Content-Type`: `application/json`

### examples

```shell
curl 'https://2.db.transport.rest/trips/1|32082|1|86|26062017?lineName=RE7'
```


## `GET /locations`

Output from [`hafas.locations(…)`](https://github.com/public-transport/hafas-client/blob/4/docs/locations.md).

- `query`: **Required.** (e.g. `Alexanderplatz`)
- `fuzzy`: Find only exact matches? Default: `true`.
- `results`: How many stations shall be shown? Default: `10`.
- `stations`: Show stations? Default: `true`.
- `poi`: Show points of interest? Default: `true`.
- `addresses`: Show addresses? Default: `true`.
- `linesOfStops`: Parse & expose lines of each station? Default: `false`.
- `language`: Language of the results. Default: `en`.

`Content-Type`: `application/json`

### examples

```shell
curl 'https://2.db.transport.rest/locations?query=Alexanderplatz'
curl 'https://2.db.transport.rest/locations?query=Pestalozzistra%C3%9Fe%2082%2C%20Berlin&poi=false&stations=false'
```


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

`Content-Type`: `application/json`

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
