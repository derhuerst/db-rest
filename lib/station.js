'use strict'

const stations = require('db-stations')

const err400 = (msg) => {
	const err = new Error(msg)
	err.statusCode = 400
	return err
}

// This is terribly inefficient, because we read all stations for every request.
// todo: optimize it
const route = (req, res, next) => {
	const id = req.params.id.trim()
	const stream = stations.full()

	let found = false
	const onStation = (station) => {
		if (station.id !== id) return
		found = true
		stream.removeListener('data', onStation)

		res.json(station)
		next()
	}
	stream.on('data', onStation)

	const onEnd = () => {
		if (!found) return next(err400('Station not found.'))
	}
	stream.once('end', onEnd)

	stream.once('error', (err) => {
		stream.removeListener('data', onStation)
		stream.removeListener('end', onEnd)
		next(nerr)
	})
}

module.exports = route
