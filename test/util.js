import {createHafasRestApi} from 'hafas-rest-api'
import getPort from 'get-port'
import {createServer} from 'node:http'
import {promisify} from 'node:util'
import axios from 'axios'
import {config, hafas as unmockedHafas} from '../api.js'

// adapted from https://github.com/public-transport/hafas-rest-api/blob/60335eacd8332d7f448da875a7498dd97934e360/test/util.js#L40-L77
const createTestApi = async (mocks, cfg) => {
	const mockedHafas = Object.assign(Object.create(unmockedHafas), mocks)

	cfg = {
		...config,
		hostname: 'localhost',
		name: 'test',
		version: '1.2.3a',
		homepage: 'http://example.org',
		description: 'test API',
		docsLink: 'https://example.org',
		logging: false,
		...cfg,
	}

	const api = await createHafasRestApi(mockedHafas, cfg, () => {})
	const server = createServer(api)

	const port = await getPort()
	await promisify(server.listen.bind(server))(port)

	const stop = () => promisify(server.close.bind(server))()
	const fetch = (path, opt = {}) => {
		opt = Object.assign({
			method: 'get',
			baseURL: `http://localhost:${port}/`,
			url: path,
			timeout: 5000
		}, opt)
		return axios(opt)
	}
	return {stop, fetch}
}

const fetchWithTestApi = async (mocks, cfg, path, opt = {}) => {
	const {fetch, stop} = await createTestApi(mocks, cfg)
	const res = await fetch(path, opt)
	await stop()
	return res
}

export {
	createTestApi,
	fetchWithTestApi,
}
