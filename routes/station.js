'use strict'

const pStations = require('../lib/db-stations')

const err404 = (msg) => {
	const err = new Error(msg)
	err.statusCode = 404
	return err
}

const stationRoute = (req, res, next) => {
	const id = req.params.id.trim()

	pStations
	.then(({data, timeModified}) => {
		const station = data[id]
		if (!station) {
			next(err404('Station not found.'))
			return;
		}

		res.setHeader('Last-Modified', timeModified.toUTCString())
		res.json(station)
	})
	.catch(next)
}

stationRoute.openapiPaths = {
	'/stations/{id}': {
		get: {
			summary: 'Returns a stop/station from `db-stations`.',
			description: `\
Returns a stop/station from [\`db-stations@3\`](https://github.com/derhuerst/db-stations/tree/3.0.1).`,
			parameters: [{
				name: 'id',
				in: 'path',
				description: 'Stop/station ID.',
				required: true,
				schema: {
					type: 'string',
				},
			}],
			responses: {
				'2XX': {
					description: 'A stop/station, in the [`db-stations@3` format](https://github.com/derhuerst/db-stations/blob/3.0.1/readme.md).',
					content: {
						'application/json': {
							schema: {
								type: 'object', // todo
							},
							// todo: example(s)
						},
					},
				},
				// todo: non-2xx response
			},
		},
	},
}

module.exports = stationRoute
