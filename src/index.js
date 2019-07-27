import debug from 'debug'
import Providers from './providers'
import { connect, disconnect, models } from './db'

const log = debug('job-store:database')
const error = debug('job-store:database:error')

/**
 * @function
 * When an exit has been requested, ensure we have flushed all the data first
 */
let dataCounter = 0
function waitToExit () {
  if (dataCounter === 0) {
    disconnect()
    process.exit()
  } else {
    setTimeout(waitToExit, 1)
  }
}

/**
 * Connect to MongoDB database
 */
connect(process.env.MONGODB_URI)

/**
 * All Providers
 */
const providers = new Providers()

/**
 * Listen to row's of data and inser them into the database
 */
providers.on('data', async data => {
  log('Record Saving')
  dataCounter++

  data.tags = data.tags.map(async tag => {
    let result = await models.Taxonomy.findOneAndUpdate(
      { name: tag },
      { name: tag },
      { upsert: true, new: true }
    ).exec()
    return result
  })

  data.tags = await Promise.all(data.tags)
  const companyName = data.company
  data.company = await models.Company.findOneAndUpdate(
    { name: companyName },
    { name: companyName },
    { upsert: true, new: true }
  ).exec()

  let [err, record] = await models.Job.create(data)
    .then(record => [null, record]).catch(err => [err, null])
  if (err) {
    if (err.errmsg.startsWith('E11000')) {
      log('Record Skipped')
    } else {
      error(err)
    }
  }
  if (record) {
    log('Record Inserted')
  }
  dataCounter--
})

/**
 * When providers have all finished, wait for database work to complete before exiting
 */
providers.on('end', () => {
  waitToExit()
})

/**
 * Start fetching data from the providers
 */
providers.fetch()
