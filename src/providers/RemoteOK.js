import p from 'pdsl'
import he from 'he'
import axios from 'axios'
import cheerio from 'cheerio'
import ProviderBase from './ProviderBase'

/** Class representing a RemoteOK provider */
export default class RemoteOK extends ProviderBase {
  constructor () {
    super()
    this.TIMEOUT = 60000
    this.PROVIDER = 'REMOTE_OK'
    this.ENDPOINT = 'https://remoteok.io/api'
  }

  /**
   * Check the given object is contains the expected attributes
   * @return {boolean} true when the object has expecteded attributes
   */
  _isValidResult (input) {
    return p`{
      url: String,
      description: String,
      position: String,
      company: String
    }`(input)
  }

  /**
   * Handle the RemoteOK response
   * @param {object} response - The raw data from the HTTP Request
   * @returns {object} The job result type
   */
  async _handleResults (response) {
    const results = response
      .filter(this._isValidResult)
      .map(result => ({
        raw: result,
        provider: this.PROVIDER,
        url: result.url,
        company: result.company,
        description: result.description,
        position: result.position,
        tags: result.tags,
        publishedAt: Date.parse(result.date)
      }))
    this.log(`Found ${results.length} jobs`)

    // emit each row to be inserted into the database as soon as it is ready
    results.forEach(item => this.emit('data', item))
    return results
  }

  /**
   * Scrape the full descriptions from the public available pages
   * @param {object} results
   * @returns {object} the given results with full descriptions
   */
  async _enhanceDescriptions (results) {
    let enhancedCount = 0
    await this._asyncForEach(results, async (result, index) => {
      try {
        const description = await this._fetchDescription(result.url)
        if (description) {
          results[index].description = description
          enhancedCount = enhancedCount + 1
        }
      } catch (e) {
        this.error(`Could not enhance description for ${result.url}`)
        this.error(e.message)
      }
    })
    this.log(`Enhanced ${enhancedCount} job descriptions`)
    return results
  }

  /**
   * Scrape the full description from the web-page
   * @param {string} url - The URL to fetch the full description
   * @returns {string} The Markdown formated description
   */
  async _fetchDescription (url) {
    const response = await axios.get(url)
    const $ = await cheerio.load(response.data)
    let text = await $('div[itemprop=description] .markdown').html()
    if (text) {
      text = await he.decode(text.replace(/{linebreak}/g, '\n'))
      return text
    } else {
      return null
    }
  }
}
