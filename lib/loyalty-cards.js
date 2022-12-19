import _loyaltyCards from 'hafas-client/p/db/loyalty-cards.js'
const {data: cards} = _loyaltyCards

const typesByName = new Map([
	// https://github.com/public-transport/hafas-client/blob/68ecd7c5e976dd2f51c5c64a81600e7e181a8996/p/db/loyalty-cards.js#L6-L11
	['bahncard-1st-25', {type: cards.BAHNCARD, discount: 25, class: 1}],
	['bahncard-2nd-25', {type: cards.BAHNCARD, discount: 25, class: 2}],
	['bahncard-1st-50', {type: cards.BAHNCARD, discount: 50, class: 1}],
	['bahncard-2nd-50', {type: cards.BAHNCARD, discount: 50, class: 2}],
	['vorteilscard', {type: cards.VORTEILSCARD}],
	['halbtaxabo-railplus', {type: cards.HALBTAXABO, railplus: true}],
	['halbtaxabo', {type: cards.HALBTAXABO, railplus: false}],
	['voordeelurenabo-railplus', {type: cards.VOORDEELURENABO, railplus: true}],
	['voordeelurenabo', {type: cards.VOORDEELURENABO, railplus: false}],
	['shcard', {type: cards.SHCARD}],
	['generalabonnement', {type: cards.GENERALABONNEMENT}],
])
const types = Array.from(typesByName.keys())

const parseLoyaltyCard = (key, val) => {
	if (typesByName.has(val)) return typesByName.get(val)
	throw new Error(key + ' must be one of ' + types.join(', '))
}

const loyaltyCardParser = {
	description: `Type of loyalty card in use.`,
	type: 'string',
	enum: types,
	defaultStr: '*none*',
	parse: parseLoyaltyCard,
}

export {
	cards as loyaltyCards,
	parseLoyaltyCard,
	loyaltyCardParser,
}
