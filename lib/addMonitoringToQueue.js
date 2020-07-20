const VError = require('verror')

const ACTIVE_COUNT_METRIC = 'active_count'
const FAILED_COUNT_METRIC = 'failed_count'
const STALLED_COUNT_METRIC = 'stalled_count'
const COMPLETED_COUNT_METRIC = 'completed_count'
const COMPLETED_DURATION_METRIC = 'completed_duration'

const defaultLogger = {
  error: console.error,
  info: console.log,
}

const addMonitoringToQueue = (config, queue) => {
  const {
    ddClient,
    logger = defaultLogger,
    reportEveryFailedAttempt,
  } = config

  const dogstatsd = ddClient && ddClient.childClient({
    prefix: 'bull.',
  })

  const metric = (type, ...params) => {
    if (dogstatsd) {
      dogstatsd[type](...params)
    }
  }

  queue.on('active', (job) => {
    logger.info(`ACTIVE:${queue.name}:${job.id}`)
    metric('increment', ACTIVE_COUNT_METRIC, [ `queue:${queue.name}`, `job:${job.name}` ])
  })

  queue.on('failed', (job) => {
    logger.info(`FAILED:${queue.name}:${job.id}`)
    if (reportEveryFailedAttempt || job.attemptsMade >= job.opts.attempts) {
      metric('increment', FAILED_COUNT_METRIC, [ `queue:${queue.name}`, `job:${job.name}` ])
    }
  })

  queue.on('waiting', (jobId) => (
    logger.info(`WAITING:${queue.name}:${jobId}`)
  ))

  queue.on('stalled', (job) => {
    logger.info(`STALLED:${queue.name}:${job.id}`)
    metric('increment', STALLED_COUNT_METRIC, [ `queue:${queue.name}`, `job:${job.name}` ])
  })

  queue.on('completed', (job) => {
    logger.info(`COMPLETED:${queue.name}:${job.id}`)
    const duration = job.processedOn - job.timestamp
    metric('timing', COMPLETED_DURATION_METRIC, duration, [ `queue:${queue.name}`, `job:${job.name}` ])
    metric('increment', COMPLETED_COUNT_METRIC, [ `queue:${queue.name}`, `job:${job.name}` ])
  })

  queue.on('paused', () => {
    logger.info(`PAUSED:${queue.name}`)
  })

  queue.on('resumed', () => {
    logger.info(`RESUMED:${queue.name}`)
  })

  queue.on('error', (error) => (
    logger.error(new VError(error, `Error on queue ${queue.name}`))
  ))

}

module.exports = addMonitoringToQueue
