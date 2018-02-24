'use strict'

let raw = require('db-stations/full.json')

let data = {}
for (let key in raw) {
	if (!Object.prototype.hasOwnProperty.call(raw, key)) continue
	const station = Object.assign({}, raw[key]) // clone

	// todo: remove this remapping (breaking change!)
	station.coordinates = station.location
	delete station.location

	data[station.id] = station
}
data = JSON.stringify(data) + '\n'
raw = null

const allStations = (req, res, next) => {
	// res.sendFile(rawPath, {
	// 	maxAge: 10 * 24 * 3600 * 1000 // 10 days
	// }, next)
	res.set('content-type', 'application/json')
	res.send(data)
}

module.exports = allStations
