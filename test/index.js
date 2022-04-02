'use strict'

const tape = require('tape')
const {loyaltyCards} = require('../lib/loyalty-cards')
const {fetchWithTestApi} = require('./util')

const NO_JOURNEYS = {
	// todo?
	journeys: [],
}

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
