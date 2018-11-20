'use strict'

const createHafas = require('db-hafas')
const createApi = require('hafas-rest-api')
const createHealthCheck = require('hafas-client-health-check')

const pkg = require('./package.json')
const stations = require('./lib/stations')
const allStations = require('./lib/all-stations')
const station = require('./lib/station')

const hafas = createHafas(pkg.name)

const berlinHbf = '8011160'
const healthCheck = createHealthCheck(hafas, berlinHbf)

const config = {
	hostname: process.env.HOSTNAME || '2.db.transport.rest',
	port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
	name: pkg.name,
	description: pkg.description,
	homepage: pkg.homepage,
	version: pkg.version,
	docsLink: 'https://github.com/derhuerst/db-rest/blob/2/docs/index.md',
	logging: true,
	healthCheck,
	aboutPage: true
}

const attachAdditionalHandlers = (api) => {
	api.get('/stations', stations)
	api.get('/stations/all', allStations)
	api.get('/stations/:id', station)
}

const api = createApi(hafas, config, attachAdditionalHandlers)

api.listen(config.port, (err) => {
	if (err) {
		console.error(err)
		process.exitCode = 1
	} else {
		console.info(`Listening on ${config.hostname}:${config.port}.`)
	}
})
