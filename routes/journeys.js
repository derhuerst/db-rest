'use strict'

const {
	parseWhen,
	parseInteger,
	parseNumber,
	parseString,
	parseBoolean,
	parseQuery,
	parseProducts,
	parseLocation
} = require('hafas-rest-api/lib/parse')
const sendServerTiming = require('hafas-rest-api/lib/server-timing')
const {
	configureJSONPrettyPrinting,
	jsonPrettyPrintingOpenapiParam,
	jsonPrettyPrintingParam,
} = require('hafas-rest-api/lib/json-pretty-printing')
const formatParsersAsOpenapiParams = require('hafas-rest-api/lib/format-parsers-as-openapi')
const formatProductParams = require('hafas-rest-api/lib/format-product-parameters')
const loyaltyCards = require('hafas-client/p/db/loyalty-cards')

const WITHOUT_FROM_TO = {
	from: null,
	'from.id': null,
	'from.name': null,
	'from.latitude': null,
	'from.longitude': null,
	to: null,
	'to.id': null,
	'to.name': null,
	'to.latitude': null,
	'to.longitude': null,
}

const err400 = (msg) => {
	const err = new Error(msg)
	err.statusCode = 400
	return err
}

const parseWalkingSpeed = (key, val) => {
	if (!['slow', 'normal', 'fast'].includes(val)) {
		throw new Error(key + ' must be `slow`, `normal`, or `fast`')
	}
	return val
}

const parseLoyaltyCard = (key, val) => {
	if (val === '1') return {type: loyaltyCards.data.BAHNCARD, discount: 25, class: 1}
	if (val === '2') return {type: loyaltyCards.data.BAHNCARD, discount: 25, class: 2}
	if (val === '3') return {type: loyaltyCards.data.BAHNCARD, discount: 50, class: 1}
	if (val === '4') return {type: loyaltyCards.data.BAHNCARD, discount: 50, class: 2}
	if (val === '9') return {type: loyaltyCards.data.VORTEILSCARD}
	if (val === '10') return {type: loyaltyCards.data.HALBTAXABO, railplus: true}
	if (val === '11') return {type: loyaltyCards.data.HALBTAXABO, railplus: false}
	if (val === '12') return {type: loyaltyCards.data.VOORDEELURENABO, railplus: true}
	if (val === '13') return {type: loyaltyCards.data.VOORDEELURENABO, railplus: false}
	if (val === '14') return {type: loyaltyCards.data.SHCARD}
	if (val === '15') return {type: loyaltyCards.data.GENERALABONNEMENT}
        return {}
}

const createRoute = (hafas, config) => {
	const parsers = {
		departure: {
			description: 'Compute journeys departing at this date/time. Mutually exclusive with `arrival`.',
			type: 'date+time',
			defaultStr: '*now*',
			parse: parseWhen(hafas.profile.timezone),
		},
		arrival: {
			description: 'Compute journeys arriving at this date/time. Mutually exclusive with `departure`.',
			type: 'date+time',
			defaultStr: '*now*',
			parse: parseWhen(hafas.profile.timezone),
		},
		earlierThan: {
			description: 'Compute journeys "before" an `ealierRef`.',
			type: 'string',
			parse: parseString,
		},
		laterThan: {
			description: 'Compute journeys "after" an `laterRef`.',
			type: 'string',
			parse: parseString,
		},

		results: {
			description: 'Max. number of journeys.',
			type: 'integer',
			default: 3,
			parse: parseInteger,
		},
		stopovers: {
			description: 'Fetch & parse stopovers on the way?',
			type: 'boolean',
			default: false,
			parse: parseBoolean,
		},
		transfers: {
			description: 'Maximum number of transfers.',
			type: 'integer',
			defaultStr: '*let HAFAS decide*',
			parse: parseInteger,
		},
		transferTime: {
			description: 'Minimum time in minutes for a single transfer.',
			type: 'integer',
			default: 0,
			parse: parseNumber,
		},
		accessibility: {
			description: '`partial` or `complete`.',
			type: 'string',
			defaultStr: '*not accessible*',
			parse: parseString,
		},
		bike: {
			description: 'Compute only bike-friendly journeys?',
			type: 'boolean',
			default: false,
			parse: parseBoolean,
		},
		startWithWalking: {
			description: 'Consider walking to nearby stations at the beginning of a journey?',
			type: 'boolean',
			default: true,
			parse: parseBoolean,
		},
		walkingSpeed: {
			description: '`slow`, `normal` or `fast`.',
			type: 'string',
			enum: ['slow', 'normal', 'fast'],
			default: 'normal',
			parse: parseWalkingSpeed,
		},
		tickets: {
			description: 'Return information about available tickets?',
			type: 'boolean',
			default: false,
			parse: parseBoolean,
		},
		polylines: {
			description: 'Fetch & parse a shape for each journey leg?',
			type: 'boolean',
			default: false,
			parse: parseBoolean,
		},
		remarks: {
			description: 'Parse & return hints & warnings?',
			type: 'boolean',
			default: true,
			parse: parseBoolean,
		},
		scheduledDays: {
			description: 'Parse & return dates each journey is valid on?',
			type: 'boolean',
			default: false,
			parse: parseBoolean,
		},
		language: {
			description: 'Language of the results.',
			type: 'string',
			default: 'en',
			parse: parseString,
		},
		loyaltyCard: {
			description: 'Type of loyalty card in use. See https://gist.github.com/juliuste/202bb04f450a79f8fa12a2ec3abcd72d.',
			type: 'integer',
			default: '0',
			parse: parseLoyaltyCard,
		},
		firstClass: {
			description: 'Search for first-class options?',
			type: 'boolean',
			default: 'false',
			parse: parseBoolean,
		},
	}

	const journeys = (req, res, next) => {
		const from = parseLocation(req.query, 'from')
		if (!from) return next(err400('Missing origin.'))
		const to = parseLocation(req.query, 'to')
		if (!to) return next(err400('Missing destination.'))

		const opt = parseQuery(parsers, req.query)
		const via = parseLocation(req.query, 'via')
		if (via) opt.via = via
		opt.products = parseProducts(hafas.profile.products, req.query)
		config.addHafasOpts(opt, 'journeys', req)

		hafas.journeys(from, to, opt)
		.then((data) => {
			sendServerTiming(res, data)
			res.setLinkHeader({
				prev: (data.earlierRef
					? req.searchWithNewParams({
						...WITHOUT_FROM_TO,
						departure: null, arrival: null,
						earlierThan: data.earlierRef,
					})
					: null
				),
				next: (data.laterRef
					? req.searchWithNewParams({
						...WITHOUT_FROM_TO,
						departure: null, arrival: null,
						laterThan: data.laterRef,
					})
					: null
				),
			})

			res.allowCachingFor(60) // 1 minute
			configureJSONPrettyPrinting(req, res)
			res.json(data)
			next()
		})
		.catch(next)
	}

	journeys.openapiPaths = {
		'/journeys': {
			get: {
				summary: 'Finds journeys from A to B.',
				description: `\
Uses [\`hafasClient.journeys()\`](https://github.com/public-transport/hafas-client/blob/5/docs/journeys.md) to **find journeys from A (\`from\`) to B (\`to\`)**.`,
				externalDocs: {
					description: '`hafasClient.journeys()` documentation',
					url: 'https://github.com/public-transport/hafas-client/blob/5/docs/journeys.md',
				},
				parameters: [
					...formatParsersAsOpenapiParams(parsers),
					jsonPrettyPrintingOpenapiParam,
				],
				responses: {
					'2XX': {
						description: 'An array of journeys, in the [`hafas-client` format](https://github.com/public-transport/hafas-client/blob/5/docs/journeys.md).',
						content: {
							'application/json': {
								schema: {
									type: 'array',
									items: {type: 'object'}, // todo
								},
								// todo: example(s)
							},
						},
						// todo: links
					},
					// todo: non-2xx response
				},
			},
		},
	}

	journeys.queryParameters = {
		'from': {docs: false},
		'from.id': {docs: false},
		'from.latitude': {docs: false}, 'from.longitude': {docs: false},
		'from.address': {docs: false},
		'from.name': {docs: false},

		'via': {docs: false},
		'via.id': {docs: false},
		'via.latitude': {docs: false}, 'via.longitude': {docs: false},
		'via.address': {docs: false},
		'via.name': {docs: false},

		'to': {docs: false},
		'to.id': {docs: false},
		'to.latitude': {docs: false}, 'to.longitude': {docs: false},
		'to.address': {docs: false},
		'to.name': {docs: false},

		...parsers,
		...formatProductParams(hafas.profile.products),
		'pretty': jsonPrettyPrintingParam,
	}
	return journeys
}

module.exports = createRoute
