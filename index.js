'use strict'

const {readFileSync} = require('fs')
const {join} = require('path')
const createDbHafas = require('db-hafas')
const createApi = require('hafas-rest-api')
const createHealthCheck = require('hafas-client-health-check')

const pkg = require('./package.json')
const stations = require('./lib/stations')
const allStations = require('./lib/all-stations')
const station = require('./lib/station')

const docsAsMarkdown = readFileSync(join(__dirname, 'docs', 'index.md'), {encoding: 'utf8'})

const pHafas = (() => {
	const hafas = createDbHafas('db-rest')
	if (!process.env.HAFAS_CLIENT_NODES) return Promise.resolve(hafas)

	const createRoundRobin = require('@derhuerst/round-robin-scheduler')
	const createRpcClient = require('hafas-client-rpc/client')

	const nodes = process.env.HAFAS_CLIENT_NODES.split(',')
	console.info('Using these hafas-client-rpc nodes:', nodes)

	return new Promise((resolve, reject) => {
		createRpcClient(createRoundRobin, nodes, (err, rpcHafas) => {
			if (err) return reject(err)
			rpcHafas.profile = hafas.profile
			resolve(rpcHafas)
		})
	})
})()

const config = {
	hostname: process.env.HOSTNAME || '3.db.transport.rest',
	port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
	name: pkg.name,
	description: pkg.description,
	homepage: pkg.homepage,
	version: pkg.version,
	docsLink: '/docs',
	logging: true,
	aboutPage: true,
	docsAsMarkdown
}
const berlinHbf = '8011160'

const attachAdditionalHandlers = (api) => {
	api.get('/stations', stations)
	api.get('/stations/all', allStations)
	api.get('/stations/:id', station)
}

pHafas
.then((hafas) => {
	const cfg = Object.assign(Object.create(null), config)
	cfg.healthCheck = createHealthCheck(hafas, berlinHbf)

	const api = createApi(hafas, cfg, attachAdditionalHandlers)
	api.listen(config.port, (err) => {
		if (err) {
			api.locals.logger.error(err)
			process.exitCode = 1
		} else api.locals.logger.info(`Listening on ${config.hostname}:${config.port}.`)
	})
})
.catch((err) => {
	console.error(err)
	process.exitCode = 1
})
