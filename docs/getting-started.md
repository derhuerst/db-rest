# Getting Started with `v5.db.transport.rest`

Let's walk through the **requests that are necessary to implement a typical basic transit app**.

*Note:* To properly & securely handle user input containing URL-unsafe characters, always [URL-encode](https://en.wikipedia.org/wiki/Percent-encoding) your query parameters!

The following code snippets use [`curl`](https://curl.haxx.se) (a versatile command line HTTP tool) and [`jq`](https://stedolan.github.io/jq/) (the command line swiss army knife for processing JSON).

### 1. search for stops

The `/locations?query=…` route allows you to query stops, points of interest (POIs) & addresses. We're only interested in stops though, so we filter using `poi=false&addresses=false`:

```shell
curl 'https://v5.db.transport.rest/locations?poi=false&addresses=false&query=südkreuz' -s | jq
```

```js
[
	{
		"type": "stop",
		"id": "8011113",
		"name": "Berlin Südkreuz",
		"location": {
			"type": "location",
			"id": "8011113",
			"latitude": 52.47623,
			"longitude": 13.365863
		},
		"products": {
			"nationalExpress": true,
			"national": true,
			// …
		}
	},
	{
		"type": "stop",
		"id": "731654",
		"name": "Südkreuz Bahnhof (S), Berlin",
		"location": {
			"type": "location",
			"id": "731654",
			"latitude": 52.476265,
			"longitude": 13.3642
		},
		"products": {
			"nationalExpress": true,
			"national": true,
			"regionalExp": true,
			"regional": true,
			"suburban": true,
			"bus": true,
			"ferry": false,
			"subway": false,
			"tram": false,
			"taxi": false
		}
	},
	{
		"type": "stop",
		"id": "727256",
		"name": "Südkreuz Bahnhof (S)/Ostseite, Berlin",
		"location": {
			"type": "location",
			"id": "727256",
			"latitude": 52.47436,
			"longitude": 13.366843
		},
		"products": {
			// …
		}
	},
	// …
]
```

### 2. fetch departures at a stop

Let's fetch 5 of the next departures at *Berlin Südkreuz* (which has the ID `8011113`):

```shell
curl 'https://v5.db.transport.rest/stops/8011113/departures?results=5' -s | jq
```

```js
[
	{
		"tripId": "1|1168945|24|80|1052020",
		"direction": "Schöneberg, Reichartstr.",
		"line": {
			"type": "line",
			"id": "5-vbbbvb-248",
			"name": "Bus 248",
			"mode": "bus",
			"product": "bus",
			// …
		},

		"when": "2020-05-01T18:39:00+02:00",
		"plannedWhen": "2020-05-01T18:38:00+02:00",
		"delay": 60,
		"platform": null,
		"plannedPlatform": null,

		"stop": {
			"type": "stop",
			"id": "727256",
			"name": "Südkreuz Bahnhof (S)/Ostseite, Berlin",
			"location": { /* … */ },
			"products": { /* … */ },
			"station": {
				"type": "station",
				"id": "8011113",
				"name": "Berlin Südkreuz",
				"location": { /* … */ },
				"products": { /* … */ },
			}
		},

		"remarks": [],
	},
	// …
	{
		"tripId": "1|322308|0|80|1052020",
		"direction": "Lutherstadt Wittenberg Hbf",
		"line": {
			"type": "line",
			"id": "re-3",
			"name": "RE 3",
			"mode": "train",
			"product": "regional",
			// …
		},

		"when": "2020-05-01T18:40:00+02:00",
		"plannedWhen": "2020-05-01T18:41:00+02:00",
		"delay": -60,
		"platform": "6",
		"plannedPlatform": "6",

		"stop": {
			"type": "stop",
			"id": "8011113",
			"name": "Berlin Südkreuz",
			"location": { /* … */ },
			"products": { /* … */ },
		},

		"remarks": [ /* … */ ],
	},
	// …
]
```

Note that `when` includes the `delay`, and `plannedWhen` does not.

### 3. fetch journeys from A to B

We call a connection from A to B – at a specific date & time, made up of sections on specific *trips* – `journey`.

Let's fetch 2 journeys from `8011113` (*Berlin Südkreuz*) to `8010159` (*Halle (Saale)Hbf*), departing tomorrow at 2pm (at the time of writing this).

```shell
curl 'https://v5.db.transport.rest/journeys?from=8011113&to=8010159&departure=tomorrow+2pm&results=2' -s | jq
```

```js
{
	"journeys": [{
		// 1st journey
		"type": "journey",
		"legs": [{
			// 1st leg
			"tripId": "1|310315|0|80|2052020",
			"direction": "München Hbf",
			"line": {
				"type": "line",
				"id": "ice-1601",
				"name": "ICE 1601",
				"mode": "train",
				"product": "nationalExpress",
				// …
			},

			"origin": {
				"type": "stop",
				"id": "8011113",
				"name": "Berlin Südkreuz",
				"location": { /* … */ },
				"products": { /* … */ },
			},
			"departure": "2020-05-02T14:37:00+02:00",
			"plannedDeparture": "2020-05-02T14:37:00+02:00",
			"departureDelay": null,
			"departurePlatform": "3",
			"plannedDeparturePlatform": "3"

			"destination": {
				"type": "stop",
				"id": "8010205",
				"name": "Leipzig Hbf",
				"location": { /* … */ },
				"products": { /* … */ },
			},
			"arrival": "2020-05-02T15:42:00+02:00",
			"plannedArrival": "2020-05-02T15:42:00+02:00",
			"arrivalDelay": null,
			"arrivalPlatform": "11",
			"plannedArrivalPlatform": "11",
			// …
		}, {
			// 2nd leg
			"walking": true,
			"distance": 116,

			"origin": {
				"type": "stop",
				"id": "8010205",
				"name": "Leipzig Hbf",
				"location": { /* … */ },
				"products": { /* … */ },
			},
			"departure": "2020-05-02T15:42:00+02:00",
			"plannedDeparture": "2020-05-02T15:42:00+02:00",
			"departureDelay": null,

			"destination": {
				"type": "stop",
				"id": "8098205",
				"name": "Leipzig Hbf (tief)",
				"location": { /* … */ },
				"products": { /* … */ },,
				"station": {
					"type": "station",
					"id": "8010205",
					"name": "Leipzig Hbf",
					"location": { /* … */ },
					"products": { /* … */ },
				}
			},
			"arrival": "2020-05-02T15:51:00+02:00",
			"plannedArrival": "2020-05-02T15:51:00+02:00",
			"arrivalDelay": null,
			// …
		}, {
			// 3rd leg
			"tripId": "1|334376|4|80|2052020",
			"direction": "Halle(Saale)Hbf",
			"line": {
				"type": "line",
				"id": "4-800486-5",
				"name": "S 5",
				"mode": "train",
				"product": "suburban",
				// …
			},

			"origin": {
				"type": "stop",
				"id": "8098205",
				"name": "Leipzig Hbf (tief)",
				"location": { /* … */ },
				"products": { /* … */ },,
				"station": {
					"type": "station",
					"id": "8010205",
					"name": "Leipzig Hbf",
					"location": { /* … */ },
					"products": { /* … */ },
				}
			},
			"departure": "2020-05-02T15:53:00+02:00",
			"plannedDeparture": "2020-05-02T15:53:00+02:00",
			"departureDelay": null,
			"departurePlatform": "2",
			"plannedDeparturePlatform": "2",

			"destination": {
				"type": "stop",
				"id": "8010159",
				"name": "Halle(Saale)Hbf",
				"location": { /* … */ },
				"products": { /* … */ },
			},
			"arrival": "2020-05-02T16:19:00+02:00",
			"plannedArrival": "2020-05-02T16:19:00+02:00",
			"arrivalDelay": null,
			"arrivalPlatform": "13",
			"plannedArrivalPlatform": "13",

			"cycle": {"min": 600, "max": 1800, "nr": 7},
			"alternatives": [
				{
					"tripId": "1|333647|0|80|2052020",
					"direction": "Halle(Saale)Hbf",
					"line": { /* … */ },
					"when": "2020-05-02T16:03:00+02:00",
					"plannedWhen": "2020-05-02T16:03:00+02:00",
					"delay": null,
				},
				// …
			],
			// …
		}],
	}, {
		// 2nd journey
		"type": "journey",
		"legs": [ /* … */ ],
		// …
	}],

	// …
}
```

Note that `departure` includes the `departureDelay`, and `arrival` includes the `arrivalDelay`. `plannedDeparture` and `plannedArrival` do not.

### 4. more features

These are the basics. Check the full [API docs](api.md) for all features!
