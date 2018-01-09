'use strict'

const hafas = require('db-hafas')
const createApi = require('hafas-rest-api')
const hsts = require('hsts')

const pkg = require('./package.json')
const stations = require('./lib/stations')
const allStations = require('./lib/all-stations')

const config = {
	hostname: process.env.HOSTNAME || '2.db.transport.rest',
	port: process.env.PORT || 3000,
	name: pkg.name,
	homepage: pkg.homepage,
	logging: true
}

const api = createApi(hafas, config, (api) => {
	api.get('/stations', stations)
	api.get('/stations/all', allStations)
})

api.listen(config.port, (err) => {
	if (err) {
		console.error(err)
		process.exitCode = 1
	} else {
		console.info(`Listening on ${config.hostname}:${config.port}.`)
	}
})
