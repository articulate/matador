const Queue = require('bull')
const mergeDeepRight = require('lodash.merge')
const addMonitoringToQueue = require('./addMonitoringToQueue')

const createQueue = (config, name, optionOverrides = {}) => {
  const {
    defaultQueueOptions = {},
  } = config

  const options = mergeDeepRight(defaultQueueOptions, optionOverrides)

  const queue = new Queue(name, config.redisUri, options)
  addMonitoringToQueue(config, queue)

  return queue
}

module.exports = createQueue
