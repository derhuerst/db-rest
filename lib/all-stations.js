'use strict'

const file = require.resolve('db-stations/full.ndjson')

const allStations = (req, res, next) => {
	res.sendFile(file, {
		maxAge: 10 * 24 * 3600 * 1000 // 10 days
	}, next)
}

module.exports = allStations
