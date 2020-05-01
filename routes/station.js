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

module.exports = stationRoute
