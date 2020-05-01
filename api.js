'use strict'

const createHafas = require('db-hafas')
const createApi = require('hafas-rest-api')
const createHealthCheck = require('hafas-client-health-check')
const {createClient: createRedis} = require('redis')
const withCache = require('cached-hafas-client')
const redisStore = require('cached-hafas-client/stores/redis')

const pkg = require('./package.json')
const stations = require('./routes/stations')
const station = require('./routes/station')

const berlinHbf = '8011160'

let hafas = createHafas(pkg.name)
let healthCheck = createHealthCheck(hafas, berlinHbf)

if (process.env.REDIS_URL) {
	const redis = createRedis({
		url: process.env.REDIS_URL,
	})
	redis.on('error', (err) => {
		api.locals.logger.error(err)
	})
	hafas = withCache(hafas, redisStore(redis))

	const checkHafas = healthCheck
	const checkRedis = () => new Promise((resolve, reject) => {
		setTimeout(reject, 1000, new Error('didn\'t receive a PONG'))
		redis.ping((err, res) => {
			if (err) reject(err)
			else resolve(res === 'PONG')
		})
	})
	healthCheck = async () => (
		(await checkHafas()) === true &&
		(await checkRedis()) === true
	)
}

const modifyRoutes = (routes) => {
	routes['/stations/:id'] = station
	routes['/stations'] = stations
	return routes
}

const config = {
	hostname: process.env.HOSTNAME || 'localhost',
	port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
	name: pkg.name,
	description: pkg.description,
	homepage: pkg.homepage,
	version: pkg.version,
	docsLink: 'https://github.com/derhuerst/db-rest/blob/5/docs/readme.md',
	logging: true,
	aboutPage: true,
	etags: 'strong',
	healthCheck,
	modifyRoutes,
}

const api = createApi(hafas, config, () => {})

module.exports = {
	config,
	api,
}
