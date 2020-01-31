'use strict'

const autocomplete = require('db-stations-autocomplete')
const allStations = require('db-stations/full.json')
const parse = require('cli-native').to
const createFilter = require('db-stations/create-filter')
const ndjson = require('ndjson')

const hasProp = (o, k) => Object.prototype.hasOwnProperty.call(o, k)

const err400 = (msg) => {
	const err = new Error(msg)
	err.statusCode = 400
	return err
}

const complete = (req, res, next) => {
	const limit = req.query.results && parseInt(req.query.results) || 3
	const fuzzy = parse(req.query.fuzzy) === true
	const completion = parse(req.query.completion) !== false
	const results = autocomplete(req.query.query, limit, fuzzy, completion)

	const data = []
	for (let result of results) {
		// todo: make this more efficient
		const station = allStations.find(s => s.id === result.id)
		if (!station) continue

		data.push(Object.assign(result, station))
	}

	res.json(data)
	next()
}

const filter = (req, res, next) => {
	if (Object.keys(req.query).length === 0) {
		return next(err400('Missing properties.'))
	}

	const selector = Object.create(null)
	for (let prop in req.query) {
		const val = parse(req.query[prop])
		// todo: derhuerst/db-rest#2
		if (prop.slice(0, 12) === 'coordinates.') {
			prop = prop.slice(12)
		}
		selector[prop] = val
	}
	const filter = createFilter(selector)

	res.type('application/x-ndjson')
	const out = ndjson.stringify()
	out
	.once('error', next)
	.pipe(res)
	.once('finish', () => next())

	for (let station of allStations) {
		if (filter(station)) out.write(station)
	}
	out.end()
}

const route = (req, res, next) => {
	if (req.query.query) complete(req, res, next)
	else filter(req, res, next)
}

module.exports = route
