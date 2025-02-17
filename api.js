// todo: use import assertions once they're supported by Node.js & ESLint
// https://github.com/tc39/proposal-import-assertions
import {createRequire} from 'node:module'
const require = createRequire(import.meta.url)

import {dirname, join as pathJoin} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createClient} from 'db-vendo-client'
import {profile as dbnavProfile} from 'db-vendo-client/p/dbnav/index.js'
import {createWriteStream} from 'node:fs'
import {createHafasRestApi} from 'hafas-rest-api'
import createHealthCheck from 'hafas-client-health-check'
import Redis from 'ioredis'
import {createCachedHafasClient} from 'cached-hafas-client'
import {createRedisStore} from 'cached-hafas-client/stores/redis.js'
import serveStatic from 'serve-static'
import {mapRouteParsers} from 'db-vendo-client/lib/api-parsers.js'
import {route as stations} from './routes/stations.js'
import {route as station} from './routes/station.js'

const pkg = require('./package.json')

const __dirname = dirname(fileURLToPath(import.meta.url))
const docsRoot = pathJoin(__dirname, 'docs')

const berlinHbf = '8011160'

const customDbProfile = {
	...dbnavProfile,
}

// todo: DRY env var check with localaddress-agent/random-from-env.js
// Currently, this is impossible: localaddress-agent is an optional dependencies, so we rely on it to check the env var.
if (process.env.RANDOM_LOCAL_ADDRESSES_RANGE) {
	const {randomLocalAddressAgent} = await import('localaddress-agent/random-from-env.js')

	customDbProfile.transformReq = (_, req) => {
		req.agent = randomLocalAddressAgent
		return req
	}
}

if (process.env.HAFAS_REQ_RES_LOG_FILE) {
	const hafasLogPath = process.env.HAFAS_REQ_RES_LOG_FILE
	const hafasLog = createWriteStream(hafasLogPath, {flags: 'a'}) // append-only
	hafasLog.on('error', (err) => console.error('hafasLog error', err))

	customDbProfile.logRequest = (ctx, req, reqId) => {
		console.error(reqId, 'req', req.body + '') // todo: remove
		hafasLog.write(JSON.stringify([reqId, 'req', req.body + '']) + '\n')
	}
	customDbProfile.logResponse = (ctx, res, body, reqId) => {
		console.error(reqId, 'res', body + '') // todo: remove
		hafasLog.write(JSON.stringify([reqId, 'res', body + '']) + '\n')
	}
}

let hafas = createClient(
	customDbProfile,
	process.env.USER_AGENT || process.env.HAFAS_USER_AGENT || pkg.name
)
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
	csp: `default-src 'none'; style-src 'self' 'unsafe-inline'; img-src https:`,
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
