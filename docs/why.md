# Why use this API?

[Deutsche Bahn itself provides an API.](https://data.deutschebahn.com/dataset/api-fahrplan) Why use this one? (And what could DB do better?)

## Realtime Data

This API returns realtime data whenever its upstream, the [API for DB's mobile app](https://github.com/public-transport/hafas-client/blob/e02a20b1de59bda3cd380445b6105e4c46036636/p/db/readme.md), provides it.

## No API Key

Especially on web sites/apps, it is a subpar solution to the send API keys to the client. Also, you have to obtain these keys manually and cannot automatically revoke them. **This API doesn't require a key.**

## CORS

If you want to use transport information on a web site/app, [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS) must be enabled. Otherwise, you would have to send all requests through your own proxy server. **This API has CORS enabled.**

## Readable Markup

Compare the underlying HAFAS API:

```js
{
	cid: 'C-0',
	date: '20171216',
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
		},
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
		products: { /* … */ },
	},
	departure: '2017-12-16T11:54:00.000+01:00',
	arrival: '2017-12-16T16:26:00.000+01:00',
}
```

## Caching-friendly

This API sends [`ETag`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag) & [`Cache-Control`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control) headers, allowing clients to refresh their state efficiently.

## HTTP/2

[HTTP/2](https://http2.github.io/) allows multiple requests at a time, efficiently pipelines sequential requests and compresses headers. See [Cloudflare's HTTP/2 page](https://blog.cloudflare.com/http-2-for-web-developers/).

## Proper HTTP, Proper REST

This wrapper API follows [REST-ful design principles](https://restfulapi.net), it uses `GET`, and proper paths & headers.

## Monitoring

There's a [status board](https://status.transport.rest) that shows realtime uptime statistics.
