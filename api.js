// todo: use import assertions once they're supported by Node.js & ESLint
// https://github.com/tc39/proposal-import-assertions
import {createRequire} from 'node:module'
const require = createRequire(import.meta.url)

import {dirname, join as pathJoin} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createClient, loadEnrichedStationData} from 'db-vendo-client'
import {defaultProfile} from 'db-vendo-client/lib/default-profile.js'
import {profile as dbProfile} from 'db-vendo-client/p/db/index.js'
import {profile as dbnavProfile} from 'db-vendo-client/p/dbnav/index.js'
import {profile as dbwebProfile} from 'db-vendo-client/p/dbweb/index.js'
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
import {parseString} from 'hafas-rest-api/lib/parse.js'
import {enrichStation} from 'db-vendo-client/parse/location.js'

const pkg = require('./package.json')

const __dirname = dirname(fileURLToPath(import.meta.url))
const docsRoot = pathJoin(__dirname, 'docs')

const berlinHbf = '8011160'

const stationIndex = await loadEnrichedStationData(defaultProfile);
const userAgent = process.env.USER_AGENT || process.env.HAFAS_USER_AGENT || pkg.name;
const opt = {
	enrichStations: (ctx, stop) => enrichStation(ctx, stop, stationIndex)
}
const profileClients = {
	'db': createClient(dbProfile, userAgent, opt),
	'dbnav': createClient(dbnavProfile, userAgent, opt),
	'dbweb': createClient(dbwebProfile, userAgent, opt),
}

const mapRouteParsersWithDynamicProfile = (route, parsers) => {
	return {
		...mapRouteParsers(route, parsers),
		profile: {
			description: 'db-vendo-client profile to use for this request',
			type: 'string',
			default: 'db',
			parse: parseString,
		},
	}
}

const profileSwitchingEndpoint = (endpoint) => {
	return (...args) => {
		const opt = args[args.length - 1];
		const p = profileClients[opt.profile] || profileClients.db;
		if (!p.departuresGetPasslist && !opt.stopovers) {
			delete opt.stopovers;
		}
		return p[endpoint](...args);
	}
}

let profileSwitchingClient = {
	profile: {
		...defaultProfile,
		locale: 'de-DE',
		timezone: 'Europe/Berlin',
		departuresGetPasslist: true,
	},
	departures: profileSwitchingEndpoint('departures'),
	arrivals: profileSwitchingEndpoint('arrivals'),
	journeys: profileSwitchingEndpoint('journeys'),
	refreshJourney: profileSwitchingEndpoint('refreshJourney'),
	trip: profileSwitchingEndpoint('trip'),
	locations: profileSwitchingEndpoint('locations'),
	stop: profileSwitchingEndpoint('stop'),
	nearby: profileSwitchingEndpoint('nearby')
}

// todo: DRY env var check with localaddress-agent/random-from-env.js
// Currently, this is impossible: localaddress-agent is an optional dependencies, so we rely on it to check the env var.
if (process.env.RANDOM_LOCAL_ADDRESSES_RANGE) {
	const {randomLocalAddressAgent} = await import('localaddress-agent/random-from-env.js')
	Object.values(profileClients).forEach(c => c.profile.transformReq = (_, req) => {
		req.agent = randomLocalAddressAgent
		return req
	})
}

if (process.env.HAFAS_REQ_RES_LOG_FILE) {
	const hafasLogPath = process.env.HAFAS_REQ_RES_LOG_FILE
	const hafasLog = createWriteStream(hafasLogPath, {flags: 'a'}) // append-only
	hafasLog.on('error', (err) => console.error('hafasLog error', err))

	Object.keys(profileClients).forEach(name => {
		profileClients[name].profile.logRequest = (ctx, req, reqId) => {
			console.error(reqId + '_' + name, 'req', req.body + '') // todo: remove
			hafasLog.write(JSON.stringify([reqId + '_' + name, 'req', req.body + '']) + '\n')
		}
		profileClients[name].profile.logResponse = (ctx, res, body, reqId) => {
			console.error(reqId + '_' + name, 'res', body + '') // todo: remove
			hafasLog.write(JSON.stringify([reqId + '_' + name, 'res', body + '']) + '\n')
		}
	})
}

let healthCheck = createHealthCheck(profileSwitchingClient, berlinHbf)

if (process.env.REDIS_URL) {
	const redis = new Redis(process.env.REDIS_URL || null)
	profileSwitchingClient = createCachedHafasClient(profileSwitchingClient, createRedisStore(redis), {
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
	mapRouteParsers: mapRouteParsersWithDynamicProfile,
	modifyRoutes,
}

const api = await createHafasRestApi(profileSwitchingClient, config, (api) => {
	api.use('/', serveStatic(docsRoot, {
		extensions: ['html', 'htm'],
	}))
})

export {
	profileSwitchingClient as hafas,
	config,
	api,
}
