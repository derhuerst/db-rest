import {checkIfResponseIsOk} from 'db-vendo-client/lib/request.js'
import {accessSync, constants as fsConstants} from 'node:fs'

const falsy = new Set(['0', 'false', 'no', 'off'])
const chromiumExecutableCandidates = [
	'/usr/bin/google-chrome',
	'/usr/bin/google-chrome-stable',
	'/usr/bin/chromium',
	'/usr/bin/chromium-browser',
	'/opt/google/chrome/chrome',
	'/snap/bin/chromium',
]

const randomBytesHexString = length => [...Array(length)]
	.map(() => Math.floor(Math.random() * 16).toString(16))
	.join('')

const headersToObject = (headers) => {
	if (headers && typeof headers.entries === 'function') {
		return Object.fromEntries(headers.entries())
	}
	return {...headers}
}

const removeHeader = (headers, headerName) => {
	const lowerName = headerName.toLowerCase()
	for (const name of Object.keys(headers)) {
		if (name.toLowerCase() === lowerName) delete headers[name]
	}
}

const getHeader = (headers, headerName) => {
	const lowerName = headerName.toLowerCase()
	const name = Object.keys(headers).find(name => name.toLowerCase() === lowerName)
	return name ? headers[name] : null
}

const addQuery = (url, query) => {
	if (!query) return url
	const params = new URLSearchParams()
	for (const [name, value] of Object.entries(query)) {
		if (value === undefined || value === null) continue
		if (Array.isArray(value)) {
			for (const item of value) params.append(name + '[]', item)
		} else {
			params.append(name, value)
		}
	}
	const queryString = params.toString().replaceAll('%5B%5D', '[]')
	return queryString ? url + '?' + queryString : url
}

const proxyFromEnv = () => {
	const address = process.env.HTTPS_PROXY || process.env.HTTP_PROXY
	if (!address) return undefined

	const url = new URL(address)
	const proxy = {server: `${url.protocol}//${url.host}`}
	if (url.username) proxy.username = decodeURIComponent(url.username)
	if (url.password) proxy.password = decodeURIComponent(url.password)
	return proxy
}

let browserPagePromise = null

const findChromiumExecutable = () => {
	if (process.env.CHROMIUM_EXECUTABLE_PATH) {
		try {
			accessSync(process.env.CHROMIUM_EXECUTABLE_PATH, fsConstants.X_OK)
			return process.env.CHROMIUM_EXECUTABLE_PATH
		} catch {
			throw new Error(
				`CHROMIUM_EXECUTABLE_PATH is not executable: ${process.env.CHROMIUM_EXECUTABLE_PATH}`,
			)
		}
	}
	for (const candidate of chromiumExecutableCandidates) {
		try {
			accessSync(candidate, fsConstants.X_OK)
			return candidate
		} catch {
			continue
		}
	}
	throw new Error(
		'Browser transport could not find Chrome or Chromium. Install it or set CHROMIUM_EXECUTABLE_PATH.',
	)
}

const openBrowserPage = async () => {
	if (!browserPagePromise) {
		browserPagePromise = (async () => {
			let chromium
			try {
				({chromium} = await import('patchright-core'))
			} catch (err) {
				throw new Error('Browser transport requires the optional patchright-core dependency.', {cause: err})
			}

			const browser = await chromium.launch({
				executablePath: findChromiumExecutable(),
				headless: true,
				proxy: proxyFromEnv(),
				args: [
					'--disable-web-security',
				],
			})
			browser.on('disconnected', () => {
				browserPagePromise = null
			})

			const context = await browser.newContext()
			return await context.newPage()
		})().catch((err) => {
			browserPagePromise = null
			throw err
		})
	}
	const page = await browserPagePromise
	if (page.isClosed()) {
		browserPagePromise = null
		return await openBrowserPage()
	}
	return page
}

const fetchInBrowser = async (page, request) => {
	return await page.evaluate(async ({url, options, timeout}) => {
		const controller = new AbortController()
		const timer = setTimeout(() => controller.abort(), timeout)
		try {
			const response = await fetch(url, {...options, signal: controller.signal})
			return {
				url: response.url,
				status: response.status,
				statusText: response.statusText,
				headers: Object.fromEntries(response.headers.entries()),
				body: await response.text(),
			}
		} finally {
			clearTimeout(timer)
		}
	}, request)
}

const requestTimeout = () => {
	const timeout = process.env.VENDO_BROWSER_TIMEOUT
		? parseInt(process.env.VENDO_BROWSER_TIMEOUT)
		: 30 * 1000
	if (!Number.isInteger(timeout) || timeout <= 0) {
		throw new Error('VENDO_BROWSER_TIMEOUT must be a positive integer in milliseconds.')
	}
	return timeout
}

const createBrowserRequest = (getPage = openBrowserPage) => {
	return async (ctx, userAgent, reqData) => {
		const {profile, opt} = ctx
		const endpoint = reqData.endpoint
		const body = JSON.stringify(profile.transformReqBody(ctx, reqData.body))
		const transformed = profile.transformReq(ctx, {
			method: reqData.method,
			body,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
				'Accept-Language': opt.language || profile.defaultLanguage || 'en',
				'user-agent': userAgent,
				...reqData.headers,
			},
			redirect: 'follow',
			query: reqData.query,
		})

		const headers = headersToObject(transformed.headers)
		// Browsers reject attempts to set this forbidden header. Keeping the
		// browser's own UA is also what gives this transport its distinct TLS/HTTP
		// fingerprint.
		removeHeader(headers, 'user-agent')
		const url = addQuery(endpoint + (reqData.path || ''), transformed.query)
		const request = {
			url,
			options: {
				method: transformed.method,
				body: transformed.body,
				headers,
				redirect: transformed.redirect,
			},
			timeout: requestTimeout(),
		}

		const reqId = randomBytesHexString(6)
		profile.logRequest(ctx, {body: transformed.body, headers, method: transformed.method, url}, reqId)

		const page = await getPage()
		const result = await fetchInBrowser(page, request)
		const responseHeaders = headersToObject(result.headers)
		const response = {
			url: result.url,
			status: result.status,
			statusText: result.statusText,
			ok: result.status >= 200 && result.status < 300,
			headers: {
				get: name => getHeader(responseHeaders, name),
			},
		}

		const errProps = {
			request: {body: transformed.body, headers, method: transformed.method, url},
			response,
			url,
		}
		if (!response.ok) {
			const err = new Error(result.statusText || `Upstream returned HTTP ${result.status}`)
			Object.assign(err, errProps, {
				upstreamBody: result.body,
				upstreamStatusCode: result.status,
			})
			throw err
		}

		const contentType = response.headers.get('content-type')
		if (contentType) {
			const actual = contentType.split(';', 1)[0].trim().toLowerCase()
			const expected = getHeader(headers, 'accept')?.toLowerCase()
			if (expected && actual !== expected) {
				const err = new Error('invalid/unsupported response content-type: ' + contentType)
				Object.assign(err, errProps)
				throw err
			}
		}

		profile.logResponse(ctx, response, result.body, reqId)
		const parsedBody = JSON.parse(result.body)
		checkIfResponseIsOk({body: parsedBody, errProps})
		return {res: parsedBody, common: {}}
	}
}

const browserTransportEnabled = () => {
	const setting = process.env.VENDO_BROWSER_TRANSPORT
	return setting === undefined || !falsy.has(setting.toLowerCase())
}
const browserRequest = createBrowserRequest()

export {
	browserRequest,
	browserTransportEnabled,
	createBrowserRequest,
	findChromiumExecutable,
}
