import {routingModes} from 'hafas-client/p/db/routing-modes.js'

const parseRoutingMode = (key, val) => {
	if ('string' !== typeof val) throw new Error(key + ' must be a string')
	val = val.toUpperCase()
	if(Object.prototype.hasOwnProperty.call(routingModes, val)) return routingModes[val]
	throw new Error(key + ' must be one of ' + Object.keys(routingModes).join(', '))
}

export {
	parseRoutingMode
}