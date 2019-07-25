import p from 'pdsl'
import he from 'he'
import axios from 'axios'
import cheerio from 'cheerio'
import ProviderBase from './ProviderBase'

/** Class representing a RemoteOK provider */
export default class RemoteOK extends ProviderBase {
  constructor () {
    super()
    this.TIMEOUT = 6000
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
   * @return {object} The job result type
   */
  async _handleResults (response) {
    const results = response.filter(this._isValidResult)
    let output = results.map(result => ({
      raw: result,
      provider: this.PROVIDER,
      url: result.url,
      company: result.company,
      description: result.description,
      position: result.position,
      tags: result.tags,
      publishedAt: Date.parse(result.date)
    }))

    this.log(`Found ${output.length} jobs`)
    if (output.length > 0) {
      return this._enhanceDescriptions(output)
    } else {
      return output
    }
  }

  async _enhanceDescriptions (results) {
    let enhancedCount = 0
    await this._asyncForEach(results, async (result, index) => {
      try {
        results[index].description = await this._fetchDescription(result.url)
        enhancedCount = enhancedCount + 1
      } catch (e) {
        this.error(`Could not enhance description for ${result.url}`, e.message)
      }
    })
    this.log(`Enhanced ${enhancedCount} job descriptions`)
    return results
  }

  /**
   * Scrape the full description from the web-page
   * @param {string} url - The URL to fetch the full description
   * @return {string} The Markdown formated description
   */
  async _fetchDescription (url) {
    const response = await axios.get(url)
    const $ = await cheerio.load(response.data)
    let text = await $('div[itemprop=description] .markdown').html().replace(/{linebreak}/g, '\n')
    text = await he.decode(text)
    return text
  }
}
