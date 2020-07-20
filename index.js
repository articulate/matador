const createWorker = require('./lib/createWorker')

module.exports = (config) => ({
  createWorker: createWorker(config),
})
