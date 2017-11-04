'use strict'

const express = require('express')
const hsts = require('hsts')
const morgan = require('morgan')
const shorthash = require('shorthash').unique
const corser = require('corser')
const compression = require('compression')
const nocache = require('nocache')

const pkg = require('./package.json')
const departures = require('./lib/departures')
const journeys = require('./lib/journeys')
const allStations = require('./lib/all-stations')



const api = express()
module.exports = api

api.use(hsts({maxAge: 24 * 60 * 60 * 1000}))

morgan.token('id', (req, res) => req.headers['x-identifier'] || shorthash(req.ip))
api.use(morgan(':date[iso] :id :method :url :status :response-time ms'))

const allowed = corser.simpleRequestHeaders.concat(['User-Agent', 'X-Identifier'])
api.use(corser.create({requestHeaders: allowed})) // CORS

api.use(compression())

api.use((req, res, next) => {
	if (!res.headersSent)
		res.setHeader('X-Powered-By', pkg.name + ' ' + pkg.homepage)
	next()
})



const noCache = nocache()

api.get('/stations/:id/departures', noCache, departures)
api.get('/journeys', noCache, journeys)
api.get('/stations/all', allStations)



api.use((err, req, res, next) => {
	if (process.env.NODE_ENV === 'dev') console.error(err)
	if (res.headersSent) return next(err)

	let msg = err.message
	let code = err.statusCode
	if (err.isHafasError) {
		msg = 'DB error: ' + msg
		code = 502
	}
	res.status(code).json({error: true, msg})
	next()
})
