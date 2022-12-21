// todo: use import assertions once they're supported by Node.js & ESLint
// https://github.com/tc39/proposal-import-assertions
import {createRequire} from 'node:module'
const require = createRequire(import.meta.url)

import {dirname, join as pathJoin} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createDbHafas as createHafas} from 'db-hafas'
import {createHafasRestApi} from 'hafas-rest-api'
import createHealthCheck from 'hafas-client-health-check'
import Redis from 'ioredis'
import {createCachedHafasClient} from 'cached-hafas-client'
import {createRedisStore} from 'cached-hafas-client/stores/redis.js'
import serveStatic from 'serve-static'
import {parseBoolean} from 'hafas-rest-api/lib/parse.js'
import {loyaltyCardParser} from './lib/loyalty-cards.js'
import {route as stations} from './routes/stations.js'
import {route as station} from './routes/station.js'

const pkg = require('./package.json')

const __dirname = dirname(fileURLToPath(import.meta.url))
const docsRoot = pathJoin(__dirname, 'docs')

const berlinHbf = '8011160'

let hafas = createHafas(pkg.name)
let healthCheck = createHealthCheck(hafas, berlinHbf)

if (process.env.REDIS_URL) {
	const redis = new Redis(process.env.REDIS_URL || null)
	hafas = createCachedHafasClient(hafas, createRedisStore(redis), {
		cachePeriods: {
			locations: 6 * 60 * 60 * 1000, // 6h
		},
	})

	const checkHafas = healthCheck
	const checkRedis = () => new Promise((resolve, reject) => {
		setTimeout(reject, 1000, new Error('didn\'t receive a PONG'))
		redis.ping().then(
			res => resolve(res === 'PONG'),
			reject,
		)
	})
	healthCheck = async () => (
		(await checkHafas()) === true &&
		(await checkRedis()) === true
	)
}

const mapRouteParsers = (route, parsers) => {
	if (route !== 'journeys') return parsers
	return {
		...parsers,
		loyaltyCard: loyaltyCardParser,
		firstClass: {
			description: 'Search for first-class options?',
			type: 'boolean',
			default: 'false',
			parse: parseBoolean,
		},
	}
}

const modifyRoutes = (routes, hafas, config) => {
	routes['/stations/:id'] = station
	routes['/stations'] = stations
	return routes
}

const config = {
	hostname: process.env.HOSTNAME || 'localhost',
	port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
	name: pkg.name,
	description: pkg.description,
	homepage: pkg.homepage,
	version: pkg.version,
	docsLink: 'https://github.com/derhuerst/db-rest/blob/6/docs/readme.md',
	openapiSpec: true,
	logging: true,
	aboutPage: false,
	etags: 'strong',
	csp: `default-src 'none' style-src 'self' 'unsafe-inline' img-src https:`,
	healthCheck,
	mapRouteParsers,
	modifyRoutes,
}

const api = await createHafasRestApi(hafas, config, (api) => {
	api.use('/', serveStatic(docsRoot, {
		extensions: ['html', 'htm'],
	}))
})

export {
	hafas,
	config,
	api,
}
