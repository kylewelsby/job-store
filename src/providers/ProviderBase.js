import axios from 'axios'
import debug from 'debug'
import EventEmitter from 'events'

/** Base Class for Provider */
export default class ProviderBase extends EventEmitter {
  /**
   * @public
   * Performs the `_makeRequest` or fail if timeout exceeded
   * @returns {Promise<object|error>} resolves the request within a given time
   * or reject with timeout error
   */
  async fetch () {
    const timeout = this._timeout(this.TIMEOUT)
    const request = this._makeRequest()
    const response = await Promise.race([
      timeout, request
    ]).then(results => this._handleResults(results))
    return response
  }

  /**
   * @private
   * Timeout resolve after given duration or reject Promise
   * @param {number} duration - The timeout duration in miliseconds
   * @returns {Promise}
   */
  async _timeout (duration = 1000) {
    return new Promise((resolve, reject) => {
      let id = setTimeout(() => {
        clearTimeout(id)
        const error = new Error(`Timeout: ${this.PROVIDER} after ${duration}ms`)
        console.error(error.message)
        reject(error)
      }, duration)
    })
  }

  /**
   * Default request to website
   * _replace this function in consuming provider for different functionality_
   * @returns {Promise}
   */
  async _makeRequest () {
    let [response, err] = await axios.get(
      this.ENDPOINT
    ).then((response) => [response, null], (err) => [null, err])
    if (!err) {
      return response.data
    } else {
      this.error(err)
      return []
    }
  }

  /**
   * Async for each helper, to iterate over an array of
   * promises with a given call back
   * @returns {Promise}
   */
  async _asyncForEach (array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array)
    }
  }

  /**
   * Log an error
   */
  error (message) {
    debug(`job-store:${this.PROVIDER}:error`)(message)
  }

  /**
   * Log information
   */
  log (message) {
    debug(`job-store:${this.PROVIDER}`)(message)
  }
}
