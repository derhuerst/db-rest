'use strict'

const computeEtag = require('etag')
const serveBuffer = require('serve-buffer')
const autocomplete = require('db-stations-autocomplete')
const parse = require('cli-native').to
const createFilter = require('db-stations/create-filter')
let pAllStations = require('../lib/db-stations')

const JSON_MIME = 'application/json'
const NDJSON_MIME = 'application/x-ndjson'

const toNdjsonBuf = (data) => {
	const chunks = []
	let i = 0, bytes = 0
	for (const id in data) {
		const sep = i++ === 0 ? '' : '\n'
		const buf = Buffer.from(sep + JSON.stringify(data[id]), 'utf8')
		chunks.push(buf)
		bytes += buf.length
	}
	return Buffer.concat(chunks, bytes)
}

pAllStations = pAllStations.then(({data, timeModified}) => {
	const asJson = Buffer.from(JSON.stringify(data), 'utf8')
	const asNdjson = toNdjsonBuf(data)
	return {
		stations: data,
		timeModified,
		asJson: {data: asJson, etag: computeEtag(asJson)},
		asNdjson: {data: asNdjson, etag: computeEtag(asNdjson)},
	}
})
.catch((err) => {
	console.error(err)
	process.exit(1)
})

const err = (msg, statusCode = 500) => {
	const err = new Error(msg)
	err.statusCode = statusCode
	return err
}

const complete = (req, res, next, q, allStations, onStation, onEnd) => {
	const limit = q.results && parseInt(q.results) || 3
	const fuzzy = parse(q.fuzzy) === true
	const completion = parse(q.completion) !== false
	const results = autocomplete(q.query, limit, fuzzy, completion)

	const data = []
	for (const result of results) {
		const station = allStations[result.id]
		if (!station) continue

		Object.assign(result, station)
		onStation(result)
	}
	onEnd()
}

const filter = (req, res, next, q, allStations, onStation, onEnd) => {
	const selector = Object.create(null)
	for (const prop in q) selector[prop] = parse(q[prop])
	const filter = createFilter(selector)

	for (const id in allStations) {
		const station = allStations[id]
		if (filter(station)) onStation(station)
	}
	onEnd()
}

const stationsRoute = (req, res, next) => {
	const t = req.accepts([JSON_MIME, NDJSON_MIME])
	if (t !== JSON_MIME && t !== NDJSON_MIME) {
		return next(err(JSON + ' or ' + NDJSON_MIME, 406))
	}

	const head = t === JSON_MIME ? '{\n' : ''
	const sep = t === JSON_MIME ? ',\n' : '\n'
	const tail = t === JSON_MIME ? '\n}\n' : '\n'
	let i = 0
	const onStation = (s) => {
		const j = JSON.stringify(s)
		const field = t === JSON_MIME ? `"${s.id}":` : ''
		res.write(`${i++ === 0 ? head : sep}${field}${j}`)
	}
	const onEnd = () => {
		if (i > 0) res.end(tail)
		else res.end(head + tail)
	}

	const q = req.query
	pAllStations
	.then(({stations, timeModified, asJson, asNdjson}) => {
		res.setHeader('Last-Modified', timeModified.toUTCString())
		if (Object.keys(req.query).length === 0) {
			const data = t === JSON_MIME ? asJson.data : asNdjson.data
			const etag = t === JSON_MIME ? asJson.etag : asNdjson.etag
			serveBuffer(req, res, data, {timeModified, etag})
		} else if (q.query) {
			complete(req, res, next, q, stations, onStation, onEnd)
		} else {
			filter(req, res, next, q, stations, onStation, onEnd)
		}
	})
	.catch(next)
}

stationsRoute.openapiPaths = {
	'/stations': {
		get: {
			summary: 'Autocompletes stops/stations by name or filters stops/stations.',
			description: `\
If the \`query\` parameter is used, it will use [\`db-stations-autocomplete\`](https://npmjs.com/package/db-stations-autocomplete) to autocomplete *Deutsche Bahn*-operated stops/stations by name. Otherwise, it will filter the stops/stations in [\`db-stations\`](https://npmjs.com/package/db-stations).

Instead of receiving a JSON response, you can request [newline-delimited JSON](http://ndjson.org) by sending \`Accept: application/x-ndjson\`.`,
			parameters: [{
				name: 'query',
				in: 'query',
				description: 'Find stations by name using [`db-stations-autocomplete`](https://npmjs.com/package/db-stations-autocomplete).',
				schema: {
					type: 'string',
				},
			}, {
				name: 'limit',
				in: 'query',
				description: '*If `query` is used:* Return at most `n` stations.',
				schema: {
					type: 'integer',
					default: 3,
				},
			}, {
				name: 'fuzzy',
				in: 'query',
				description: '*If `query` is used:* Find stations despite typos.',
				schema: {
					type: 'boolean',
					default: false,
				},
			}, {
				name: 'completion',
				in: 'query',
				description: '*If `query` is used:* Autocomplete stations.',
				schema: {
					type: 'boolean',
					default: true,
				},
			}],
			responses: {
				'2XX': {
					description: 'An array of stops/stations, in the [`db-stations` format](https://github.com/derhuerst/db-stations/blob/master/readme.md).',
					content: {
						'application/json': {
							schema: {
								type: 'array',
								items: {type: 'object'}, // todo
							},
							// todo: example(s)
						},
					},
				},
			},
		},
	},
}

stationsRoute.queryParameters = {
	query: {
		description: 'Find stations by name using [`db-stations-autocomplete`](https://npmjs.com/package/db-stations-autocomplete).',
		type: 'string',
		defaultStr: '–',
	},
	limit: {
		description: '*If `query` is used:* Return at most `n` stations.',
		type: 'number',
		default: 3,
	},
	fuzzy: {
		description: '*If `query` is used:* Find stations despite typos.',
		type: 'boolean',
		default: false,
	},
	completion: {
		description: '*If `query` is used:* Autocomplete stations.',
		type: 'boolean',
		default: true,
	},
}

module.exports = stationsRoute
