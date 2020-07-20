const mergeDeepRight = require('lodash.merge')
const createQueue = require('./createQueue')

const createWorker = (config) => (params) => {
  const worker = {
    ...params,

    // only create the queue if it is going to be used
    get queue() {
      const {
        name,
        queueOptions,
      } = this

      if (!this._q)
        this._q = createQueue(config, name, queueOptions)

      return this._q
    },

    add(data = {}, jobOptionOverrides = {}) {
      const {
        jobOptions,
        queue,
      } = this

      const options = mergeDeepRight(jobOptions, jobOptionOverrides)

      return queue.add(data, options)
    },

    start () {
      const {
        concurrency = 1,
        jobOptions = {},
        processor,
        queue,
        scheduledJobData,
      } = this


      queue.process('*', concurrency, processor)

      // auto-schedule the repeating job
      if (jobOptions.repeat) {
        return this.add(scheduledJobData)
      }
    },
  }

  worker.add = worker.add.bind(worker)
  worker.start = worker.start.bind(worker)

  return worker
}

module.exports = createWorker
