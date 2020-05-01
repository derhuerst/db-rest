'use strict'

const {api, config} = require('./api')

api.listen(config.port, (err) => {
	const {logger} = api.locals
	if (err) {
		logger.error(err)
		process.exit(1)
	} else {
		logger.info(`Listening on ${config.hostname}:${config.port}.`)
	}
})
