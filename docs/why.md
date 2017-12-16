# Why use this API?

[Deutsche Bahn itself provides an API.](https://data.deutschebahn.com/dataset/api-fahrplan) Why use this one? (And what could DB do better?)

## Realtime Data

This API returns realtime data whenever its upstream, the [API for DB's mobile app](https://gist.github.com/derhuerst/2a735268bd82a0a6779633f15dceba33), provides it.

## No API Key

Especially on web sites/apps, it is a subpar solution to the send API keys to the client. Also, you have to obtain these keys manually and cannot automatically revoke them. **This API doesn't require a key.**

## Sane Markup

Compare the official API:

```js
{
	cid: 'C-0',
	date: '20171216',
	dur: '043200',
	chg: 2,
	sDays: { /* … */ },
	dep: {
		locX: 0,
		dPlatfS: '6',
		dInR: true,
		dTimeS: '115400',
		dProgType: 'PROGNOSED',
		dTZOffset: 60,
		type: 'N'
	},
	arr: {
		locX: 2,
		aPlatfS: '4',
		aOutR: true,
		aTimeS: '162600',
		aProgType: 'PROGNOSED',
		aTZOffset: 60,
		type: 'N'
	},
	/* … */
}
```

to this one:

```js
{
	origin: {
		type: 'station',
		id: '8089066',
		name: 'Berlin Friedrichstraße (S)',
		location: {
			type: 'location',
			latitude: 52.520331,
			longitude: 13.386934
		},
		products: {
			nationalExp: false,
			national: false,
			regionalExp: false,
			regional: true,
			suburban: true,
			bus: true,
			ferry: false,
			subway: true,
			tram: true,
			taxi: false
		}
	},
	destination: {
		type: 'station',
		id: '8004158',
		name: 'München-Pasing',
		location: {
			type: 'location',
			latitude: 48.150036,
			longitude: 11.461624
		},
		products: {
			nationalExp: true,
			national: true,
			regionalExp: false,
			regional: true,
			suburban: true,
			bus: true,
			ferry: false,
			subway: false,
			tram: true,
			taxi: false
		}
	},
	departure: '2017-12-16T11:54:00.000+01:00',
	arrival: '2017-12-16T16:26:00.000+01:00',
	price: {
		amount: 150,
		hint: null
	}
}
```

## GZIP support

Especially on cellular connections, gzipped responses improve the performance a lot.

## HTTP/2

[HTTP/2](https://http2.github.io/) allows multiple requests at a time, efficiently pipelines sequential requests and compresses headers. See [Cloudflare's HTTP/2 page](https://blog.cloudflare.com/http-2-for-web-developers/).

## More Features

This API enhances the functionality of their API with static data, which is used in e.g. `GET /stations`.

## Monitoring

There's a [status board](https://status.transport.rest) that indicates the health of the API endpoints.
