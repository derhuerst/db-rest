import tape from 'tape'
import _ndjson from 'ndjson'
const {parse: ndjsonParser} = _ndjson
import {data as loyaltyCards} from 'db-vendo-client/format/loyalty-cards.js'
import {fetchWithTestApi} from './util.js'
import {pStations as pAllStations} from '../lib/db-stations.js'
import {createBrowserRequest} from '../lib/browser-request.js'

const NO_JOURNEYS = {
	// todo?
	journeys: [],
}

tape.test('browser transport sends and parses a vendo request', async (t) => {
	let browserRequest
	const request = createBrowserRequest(async () => ({
		evaluate: async (_, req) => {
			browserRequest = req
			return {
				url: req.url,
				status: 200,
				statusText: 'OK',
				headers: {'content-type': 'application/vnd.example+json; charset=utf-8'},
				body: JSON.stringify({items: [1]}),
			}
		},
	}))
	const profile = {
		defaultLanguage: 'de',
		transformReqBody: (_, body) => ({...body, transformed: true}),
		transformReq: (_, req) => ({...req, query: {item: ['a', 'b']}}),
		logRequest: () => {},
		logResponse: () => {},
	}
	const result = await request({profile, opt: {}}, 'db-rest/test', {
		endpoint: 'https://example.org/',
		path: 'endpoint',
		method: 'post',
		body: {value: 1},
		headers: {
			'Accept': 'application/vnd.example+json',
			'Content-Type': 'application/vnd.example+json',
		},
	})

	t.deepEqual(result, {res: {items: [1]}, common: {}})
	t.equal(browserRequest.url, 'https://example.org/endpoint?item[]=a&item[]=b')
	t.equal(browserRequest.options.headers['user-agent'], undefined)
	t.deepEqual(JSON.parse(browserRequest.options.body), {value: 1, transformed: true})
})

tape.test('/journeys?firstClass works', async (t) => {
	await fetchWithTestApi({
		journeys: async (from, to, opt = {}) => {
			t.equal(opt.firstClass, true, 'journeys() called with invalid opt.firstClass')
			return NO_JOURNEYS
		}
	}, {}, '/journeys?from=123&to=234&firstClass=true')
})

tape.test('/journeys?loyaltyCard works', async (t) => {
	await fetchWithTestApi({
		journeys: async (from, to, opt = {}) => {
			t.deepEqual(opt.loyaltyCard, {
				type: loyaltyCards.SHCARD,
			}, 'journeys() called with invalid opt.loyaltyCard')
			return NO_JOURNEYS
		}
	}, {}, '/journeys?from=123&to=234&loyaltyCard=shcard')

	await fetchWithTestApi({
		journeys: async (from, to, opt = {}) => {
			t.deepEqual(opt.loyaltyCard, {
				type: loyaltyCards.BAHNCARD,
				discount: 50,
				class: 2,
			}, 'journeys() called with invalid opt.loyaltyCard')
			return NO_JOURNEYS
		}
	}, {}, '/journeys?from=123&to=234&loyaltyCard=bahncard-2nd-50')
})

tape.test('/stations works', async (t) => {
	const {data: allStations} = await pAllStations
	const someStationId = Object.keys(allStations)[0]

	{
		const {headers, data} = await fetchWithTestApi({}, {}, '/stations', {
			headers: {
				'accept': 'application/json',
			},
		})
		t.equal(headers['content-type'], 'application/json')
		t.equal(typeof data, 'object')
		t.ok(data)
		t.ok(data[someStationId])
		t.equal(Object.keys(data).length, Object.keys(allStations).length)
	}

	{
		const {headers, data} = await fetchWithTestApi({}, {}, '/stations', {
			headers: {
				'accept': 'application/x-ndjson',
			},
		})
		t.equal(headers['content-type'], 'application/x-ndjson')

		let nrOfStations = 0
		const parser = ndjsonParser()
		parser.end(data)
		for await (const station of parser) nrOfStations++

		t.equal(nrOfStations, Object.keys(allStations).length)
	}
})

tape.test('/stations?query=frankfurt%20ha works', async (t) => {
	const FRANKFURT_MAIN_HBF = '8000105'

	{
		const {headers, data} = await fetchWithTestApi({}, {}, '/stations?query=frankfurt%20ha', {
			headers: {
				'accept': 'application/json',
			},
		})
		t.equal(headers['content-type'], 'application/json')
		t.equal(typeof data, 'object')
		t.ok(data)
		t.ok(data[FRANKFURT_MAIN_HBF])
		t.ok(Object.keys(data).length > 0)
	}

	{
		const {headers, data} = await fetchWithTestApi({}, {}, '/stations?query=frankfurt%20ha', {
			headers: {
				'accept': 'application/x-ndjson',
			},
		})
		t.equal(headers['content-type'], 'application/x-ndjson')

		const stations = []
		const parser = ndjsonParser()
		parser.end(data)
		for await (const station of parser) stations.push(station)

		t.ok(stations.find(s => s.id === FRANKFURT_MAIN_HBF))
		t.ok(stations.length > 0)
	}
})
