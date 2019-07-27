import debug from 'debug'
import EventEmitter from 'events'
import RemoteOK from './RemoteOK'

const log = debug('job-store:providers')

const classMapping = {
  'remote_ok': RemoteOK
}

class DynamicClass {
  constructor (className, ...opts) {
    return new classMapping[className](...opts)
  }
}

export default class Providers extends EventEmitter {
  constructor () {
    super()
    this.timeouts = []
    this.data = []
    this.detailed = {}
    this.successCount = 0
    this.failureCount = 0
    this.totalCount = 0
  }

  /**
   * Fetches a single provider with timing metadata
   * @param {string} provider - the provider to fetch defined in the classMapping
   * @returns {Promise.<object|Error>} - The data collected from the target provider
   * or an error if rejected.
   */
  fetchProvider (provider) {
    const resource = new DynamicClass(provider)
    this.totalCount++
    this.detailed[provider] = {
      timeTaken: '0ms',
      resultsCount: 0,
      isSuccess: false
    }
    // re-emit the row event
    resource.on('data', data => this.emit('data', data))

    const startAt = new Date()

    return resource.fetch()
      .then(data => {
        this.successCount++
        this.detailed[provider].isSuccess = true
        this.detailed[provider].resultsCount = data.length
        data.forEach(row => {
          this.data.push(row)
        })
      })
      .catch(err => {
        this.failureCount++
        if (/Timeout/.test(err.message)) {
          this.timeouts.push(err.message)
        }
      })
      .finally(() => {
        this.detailed[provider].timeTaken = new Date().getTime() - startAt.getTime() + 'ms'
      })
  }

  /**
   * Fetches providers with metadata
   * @param {string} provider - the provider to fetch defined in the classMapping
   * @returns {Promise.<object|Error>} - The data collected from all providers with metadata
   * or an error if rejected.
   */
  async fetch () {
    const startAt = new Date()
    const promises = Object.keys(classMapping).map(provider => this.fetchProvider(provider))
    const results = await Promise.all(promises)
      .then(results => {
        const out = {
          meta: {
            overall: {
              totalTimeTaken: new Date().getTime() - startAt.getTime() + 'ms'
            },
            providers: {
              success: this.successCount,
              failure: this.failureCount,
              count: this.totalCount
            },
            detailed: this.detailed,
            results: {
              total: this.data.length
            }
          },
          data: this.data
        }
        log(out.meta)
        return out
      })
      .finally(() => {
        this.emit('end')
      })
    return results
  }
}
