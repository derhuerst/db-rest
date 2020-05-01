'use strict'

const {statSync} = require('fs')
const {full: readRawStations} = require('db-stations')

// We don't have access to the publish date+time of the npm package,
// so we use the ctime of db-stations/full.ndjson as an approximation.
// todo: this is brittle, find a better way, e.g. a build script
const timeModified = statSync(require.resolve('db-stations/full.ndjson')).ctime

const pStations = new Promise((resolve, reject) => {
	let raw = readRawStations()
	raw.once('error', reject)

	let data = Object.create(null)
	raw.on('data', (station) => {
		data[station.id] = station
		if (Array.isArray(station.ril100Identifiers)) {
			for (const ril100 of station.ril100Identifiers) {
				data[ril100.rilIdentifier] = station
			}
		}
		if (Array.isArray(station.additionalIds)) {
			for (const addId of station.additionalIds) {
				data[addId] = station
			}
		}
	})
	raw.once('end', () => {
		raw = null
		resolve({data, timeModified})
	})
})

pStations.catch((err) => {
	console.error(err)
	process.exit(1) // todo: is this appropriate?
})

module.exports = pStations
