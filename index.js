'use strict'

const hafas = require('db-hafas')
const createApi = require('hafas-rest-api')

const pkg = require('./package.json')
const stations = require('./lib/stations')
const allStations = require('./lib/all-stations')
const station = require('./lib/station')

const config = {
	hostname: process.env.HOSTNAME || '2.db.transport.rest',
	port: process.env.PORT || 3000,
	name: pkg.name,
	description: pkg.description,
	homepage: pkg.homepage,
	docsLink: 'https://github.com/derhuerst/db-rest/blob/master/docs/index.md',
	logging: true,
	aboutPage: true
}

const api = createApi(hafas, config, (api) => {
	api.get('/stations', stations)
	api.get('/stations/all', allStations)
	api.get('/stations/:id', station)
})

api.listen(config.port, (err) => {
	if (err) {
		console.error(err)
		process.exitCode = 1
	} else {
		console.info(`Listening on ${config.hostname}:${config.port}.`)
	}
})
