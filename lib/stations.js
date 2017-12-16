'use strict'

const autocomplete = require('db-stations-autocomplete')
const stations = require('db-stations')
const parse = require('cli-native').to
const createFilter = require('db-stations/create-filter')
const filterStream = require('stream-filter')
const ndjson = require('ndjson')

const err400 = (msg) => {
	const err = new Error(msg)
	err.statusCode = 400
	return err
}

const complete = (req, res, next) => {
	const fuzzy = req.query.fuzzy === 'true'
	const completion = req.query.completion !== 'false'

	res.json(autocomplete(req.query.query, fuzzy, completion))
	next()
}

const filter = (req, res, next) => {
	if (Object.keys(req.query).length === 0) {
		return next(err400('Missing properties.'))
	}

	const selector = Object.create(null)
	for (let prop in req.query) selector[prop] = parse(req.query[prop])
	const filter = createFilter(selector)

	stations.full()
	.on('error', next)
	.pipe(filterStream.obj(filter))
	.on('error', next)
	.pipe(ndjson.stringify())
	.on('error', next)
	.pipe(res)
	.once('finish', () => next())
}

const route = (req, res, next) => {
	if (req.query.query) complete(req, res, next)
	else filter(req, res, next)
}

module.exports = route
