import {generateApiDocs} from 'hafas-rest-api/tools/generate-docs.js'
import {api} from '../api.js'

const HEAD = `\
# \`v6.db.transport.rest\` API documentation

[\`v6.db.transport.rest\`](https://v6.db.transport.rest/) is a [REST API](https://restfulapi.net). Data is being returned as [JSON](https://www.json.org/).

You can just use the API without authentication. There's a [rate limit](https://apisyouwonthate.com/blog/what-is-api-rate-limiting-all-about) of 100 request/minute (burst 200 requests/minute) set up.

[OpenAPI playground](https://petstore.swagger.io/?url=https%3A%2F%2Fv6.db.transport.rest%2F.well-known%2Fservice-desc%0A)

*Note:* The examples snippets in this documentation uses the \`url-encode\` CLI tool of the [\`url-decode-encode-cli\` package](https://www.npmjs.com/package/url-decode-encode-cli) for [URL-encoding](https://de.wikipedia.org/wiki/URL-Encoding).
`

const order = [
	'/locations',
	'/stops/nearby',
	'/stops/reachable-from',
	'/stops/:id',
	'/stops/:id/departures',
	'/stops/:id/arrivals',
	'/journeys',
	'/journeys/:ref',
	'/trips/:id',
	'/stations',
	'/stations/:id',
	'/radar',
]

const descriptions = {
	'/locations': `\
Uses [\`hafasClient.locations()\`](https://github.com/public-transport/hafas-client/blob/6/docs/locations.md) to **find stops/stations, POIs and addresses matching \`query\`**.
`,
	'/stops/nearby': `\
Uses [\`hafasClient.nearby()\`](https://github.com/public-transport/hafas-client/blob/6/docs/nearby.md) to **find stops/stations close to the given geolocation**.
`,
	'/stops/reachable-from': `\
Uses [\`hafasClient.reachableFrom()\`](https://github.com/public-transport/hafas-client/blob/6/docs/reachable-from.md) to **find stops/stations reachable within a certain time from an address**.
`,
	'/stops/:id': `\
Uses [\`hafasClient.stop()\`](https://github.com/public-transport/hafas-client/blob/6/docs/stop.md) to **find a stop/station by ID**.
`,
	'/stops/:id/departures': `\
Uses [\`hafasClient.departures()\`](https://github.com/public-transport/hafas-client/blob/6/docs/departures.md) to **get departures at a stop/station**.
`,
	'/stops/:id/arrivals': `\
Works like [\`/stops/:id/departures\`](#get-stopsiddepartures), except that it uses [\`hafasClient.arrivals()\`](https://github.com/public-transport/hafas-client/blob/6/docs/arrivals.md) to **arrivals at a stop/station**.
`,
	'/stations': `\
If the \`query\` parameter is used, it will use [\`db-stations-autocomplete@2\`](https://github.com/derhuerst/db-stations-autocomplete/tree/2.2.0) to autocomplete *Deutsche Bahn*-operated stops/stations. Otherwise, it will filter the stops/stations in [\`db-stations@3\`](https://github.com/derhuerst/db-stations/tree/3.0.1).

Instead of receiving a JSON response, you can request [newline-delimited JSON](http://ndjson.org) by sending \`Accept: application/x-ndjson\`.
`,
	'/stations/:id': `\
Returns a stop/station from [\`db-stations\`](https://npmjs.com/package/db-stations).
`,
	'/journeys': `\
Uses [\`hafasClient.journeys()\`](https://github.com/public-transport/hafas-client/blob/6/docs/journeys.md) to **find journeys from A (\`from\`) to B (\`to\`)**.

\`from\` (A), \`to\` (B), and the optional \`via\` must each have one of these formats:

- as stop/station ID (e.g. \`from=8010159\` for *Halle (Saale) Hbf*)
- as a POI (e.g. \`from.id=991561765&from.latitude=51.48364&from.longitude=11.98084&from.name=Halle+(Saale),+Stadtpark+Halle+(Grünanlagen)\` for *Halle+(Saale),+Stadtpark+Halle+(Grünanlagen)*)
- as an address (e.g. \`from.latitude=51.25639&from.longitude=7.46685&from.address=Hansestadt+Breckerfeld,+Hansering+3\` for *Hansestadt Breckerfeld, Hansering 3*)

### Pagination

Given a response, you can also fetch more journeys matching the same criteria. Instead of \`from*\`, \`to*\` & \`departure\`/\`arrival\`, pass \`earlierRef\` from the first response as \`earlierThan\` to get journeys "before", or \`laterRef\` as \`laterThan\` to get journeys "after".

Check the [\`hafasClient.journeys()\` docs](https://github.com/public-transport/hafas-client/blob/6/docs/journeys.md) for more details.
`,
	'/journeys/:ref': `\
Uses [\`hafasClient.refreshJourney()\`](https://github.com/public-transport/hafas-client/blob/6/docs/refresh-journey.md) to **"refresh" a journey, using its \`refreshToken\`**.

The journey will be the same (equal \`from\`, \`to\`, \`via\`, date/time & vehicles used), but you can get up-to-date realtime data, like delays & cancellations.
`,
	'/trips/:id': `\
Uses [\`hafasClient.trip()\`](https://github.com/public-transport/hafas-client/blob/6/docs/trip.md) to **fetch a trip by ID**.

A trip is a specific vehicle, stopping at a series of stops at specific points in time. Departures, arrivals & journey legs reference trips by their ID.
`,
	'/radar': `\
Uses [\`hafasClient.radar()\`](https://github.com/public-transport/hafas-client/blob/6/docs/radar.md) to **find all vehicles currently in an area**, as well as their movements.
`,
}

const examples = {
	'/locations': `\
### Example

\`\`\`shell
curl 'https://v6.db.transport.rest/locations?query=halle&results=1' -s | jq
\`\`\`

\`\`\`js
[
	{
		"type": "stop",
		"id": "8010159",
		"name": "Halle (Saale) Hbf",
		"location": {
			"type": "location",
			"id": "8010159",
			"latitude": 51.477079,
			"longitude": 11.98699
		},
		"products": {
			"nationalExpress": true,
			"national": true,
			// …
		}
	}
]
\`\`\`
`,
	'/stops/nearby': `\
### Example

\`\`\`shell
curl 'https://v6.db.transport.rest/stops/nearby?latitude=53.5711&longitude=10.0015' -s | jq
\`\`\`

\`\`\`js
[
	{
		"type": "stop",
		"id": "694800",
		"name": "Böttgerstraße, Hamburg",
		"location": {
			"type": "location",
			"id": "694800",
			"latitude": 53.568356,
			"longitude": 9.995528
		},
		"products": { /* … */ },
		"distance": 498,
	},
	// …
	{
		"type": "stop",
		"id": "694802",
		"name": "Bahnhof Dammtor, Hamburg",
		"location": {
			"type": "location",
			"id": "694802",
			"latitude": 53.561048,
			"longitude": 9.990315
		},
		"products": { /* … */ },
		"distance": 1340,
	},
	// …
]
\`\`\`
`,
	'/stops/reachable-from': `\
### Example

\`\`\`shell
curl 'https://v6.db.transport.rest/stops/reachable-from?latitude=53.553766&longitude=9.977514&address=Hamburg,+Holstenwall+9' -s | jq
\`\`\`

\`\`\`js
[
	{
		"duration": 1,
		"stations": [
			{
				"type": "stop",
				"id": "694815",
				"name": "Handwerkskammer, Hamburg",
				"location": { /* … */ },
				"products": { /* … */ },
			},
		]
	},
	// …
	{
		"duration": 5,
		"stations": [
			{
				"type": "stop",
				"id": "694807",
				"name": "Feldstraße (U), Hamburg",
				"location": { /* … */ },
				"products": { /* … */ },
				// …
			},
			// …
		]
	},
	// …
]
\`\`\`
`,
	'/stops/:id': `\
### Example

\`\`\`shell
curl 'https://v6.db.transport.rest/stops/8010159' -s | jq
\`\`\`

\`\`\`js
{
	"type": "stop",
	"id": "8010159",
	"ids": {
		"dhid": "de:15002:8010159",
		"MDV": "8010159",
		"NASA": "8010159"
	},
	"name": "Halle (Saale) Hbf",
	"location": {
		"type": "location",
		"id": "8010159",
		"latitude": 51.477079,
		"longitude": 11.98699
	},
	"products": { /* … */ },
	// …
}
\`\`\`
`,
	'/stations': `\
### Examples

\`\`\`shell
# autocomplete using db-stations-autocomplete
curl 'https://v6.db.transport.rest/stations?query=dammt' -s | jq
\`\`\`

\`\`\`js
{
	"8002548": {
		"id": "8002548",
		"relevance": 0.8572361756428573,
		"score": 9.175313823998414,
		"weight": 1212,
		"type": "station",
		"ril100": "ADF",
		"name": "Hamburg Dammtor",
		"location": {
			"type": "location",
			"latitude": 53.560751,
			"longitude": 9.989566
		},
		"operator": {
			"type": "operator",
			"id": "hamburger-verkehrsverbund-gmbh",
			"name": "BWVI"
		},
		"address": {
			"city": "Hamburg",
			"zipcode": "20354",
			"street": "Dag-Hammarskjöld-Platz 15"
		},
		// …
	},
	// …
}
\`\`\`

\`\`\`shell
# filter db-stations by \`hasParking\` property
curl 'https://v6.db.transport.rest/stations?hasParking=true' -s | jq
\`\`\`

\`\`\`js
{
	"8000001": {
		"type": "station",
		"id": "8000001",
		"ril100": "KA",
		"name": "Aachen Hbf",
		"weight": 653.75,
		"location": { /* … */ },
		"operator": { /* … */ },
		"address": { /* … */ },
		// …
	},
	// …
}
\`\`\`

\`\`\`shell
# filter db-stations by \`hasDBLounge\` property, get newline-delimited JSON
curl 'https://v6.db.transport.rest/stations?hasDBLounge=true' -H 'accept: application/x-ndjson' -s | jq
\`\`\`
`,
	'/stations/:id': `\
### Example

\`\`\`shell
# lookup Halle (Saale) Hbf
curl 'https://v6.db.transport.rest/stations/8010159' -s | jq
curl 'https://v6.db.transport.rest/stations/LH' -s | jq # RIL100/DS100
curl 'https://v6.db.transport.rest/stations/LHG' -s | jq # RIL100/DS100
\`\`\`

\`\`\`js
{
	"type": "station",
	"id": "8010159",
	"additionalIds": ["8098159"],
	"ril100": "LH",
	"nr": 2498,
	"name": "Halle (Saale) Hbf",
	"weight": 815.6,
	"location": { /* … */ },
	"operator": { /* … */ },
	"address": { /* … */ },
	"ril100Identifiers": [
		{
			"rilIdentifier": "LH",
			// …
		},
		// …
	],
	// …
}
\`\`\`
`,
	'/stops/:id/departures': `\
### Example

\`\`\`shell
# at Halle (Saale) Hbf, in direction Berlin Südkreuz
curl 'https://v6.db.transport.rest/stops/8010159/departures?direction=8011113&duration=120' -s | jq
\`\`\`

\`\`\`js
[
	{
		"tripId": "1|317591|0|80|1052020",
		"direction": "Berlin Hbf (tief)",
		"line": {
			"type": "line",
			"id": "ice-702",
			"name": "ICE 702",
			"mode": "train",
			"product": "nationalExpress",
			// …
		},

		"when": "2020-05-01T21:06:00+02:00",
		"plannedWhen": "2020-05-01T21:06:00+02:00",
		"delay": 0,
		"platform": "8",
		"plannedPlatform": "8",

		"stop": {
			"type": "stop",
			"id": "8010159",
			"name": "Halle (Saale) Hbf",
			"location": { /* … */ },
			"products": { /* … */ },
		},

		"remarks": [],
		// …
	}
]
\`\`\`
`,
	'/stops/:id/arrivals': `\
### Example

\`\`\`shell
# at Halle (Saale) Hbf, 10 minutes
curl 'https://v6.db.transport.rest/stops/8010159/arrivals?duration=10' -s | jq
\`\`\`
`,
	'/journeys': `\
### Examples

\`\`\`shell
# stop/station to POI
curl 'https://v6.db.transport.rest/journeys?from=8010159&to.id=991561765&to.latitude=51.483641&to.longitude=11.980841' -s | jq
# without buses, with ticket info
curl 'https://v6.db.transport.rest/journeys?from=…&to=…&bus=false&tickets=true' -s | jq
\`\`\`
`,
	'/journeys/:ref': `\
### Example

\`\`\`shell
# get the refreshToken of a journey
journey=$(curl 'https://v6.db.transport.rest/journeys?from=…&to=…&results=1' -s | jq '.journeys[0]')
refresh_token=$(echo $journey | jq -r '.refreshToken')

# refresh the journey
curl "https://v6.db.transport.rest/journeys/$(echo $refresh_token | url-encode)" -s | jq
\`\`\`
`,
	'/trips/:id': `\
### Example

\`\`\`shell
# get the trip ID of a journey leg
journey=$(curl 'https://v6.db.transport.rest/journeys?from=…&to=…&results=1' -s | jq '.journeys[0]')
journey_leg=$(echo $journey | jq -r '.legs[0]')
trip_id=$(echo $journey_leg | jq -r '.tripId')

# fetch the trip
curl "https://v6.db.transport.rest/trips/$(echo $trip_id | url-encode)" -s | jq
\`\`\`
`,
	'/radar': `\
### Example

\`\`\`shell
bbox='north=53.555&west=9.989&south=53.55&east=10.001'
curl "https://v6.db.transport.rest/radar?$bbox&results=10" -s | jq
\`\`\`
`,
}

const generateMarkdownApiDocs = async function* () {
	const {
		listOfRoutes,
		routes,
		tail,
	} = generateApiDocs(api.routes)

	const sortedRoutes = Object.entries(routes)
	.sort(([routeA], [routeB]) => {
		const iA = order.indexOf(routeA)
		const iB = order.indexOf(routeB)
		if (iA >= 0 && iB >= 0) return iA - iB
		if (iA < 0 && iB >= 0) return 1
		if (iB < 0 && iA >= 0) return -1
		return 0
	})

	yield HEAD
	yield `\n\n`

	yield listOfRoutes
	yield `\n\n`

	for (const [route, params] of sortedRoutes) {
		yield `## \`GET ${route}\`\n\n`
		yield descriptions[route] || ''
		yield `\n### Query Parameters\n`
		yield params
		if (examples[route]) {
			yield '\n' + examples[route]
		}
		yield `\n\n`
	}
	yield tail
}

export {
	generateMarkdownApiDocs,
}