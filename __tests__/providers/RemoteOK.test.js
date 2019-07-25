import nock from 'nock'
import path from 'path'

import RemoteOK from '../../src/providers/RemoteOK'

describe('RemoteOK', () => {
  describe('.fetch', () => {
    it('returns a formatted response', async () => {
      nock('https://remoteok.io')
        .get('/api')
        .replyWithFile(200, path.join(__dirname, '../__fixtures__/RemoteOK.json'))
      nock('https://remoteok.io')
        .persist()
        .get(uri => uri.includes('remote-jobs'))
        .replyWithFile(200, path.join(__dirname, '../__fixtures__/RemoteOK.page.html'))

      const provider = new RemoteOK()
      const results = await provider.fetch()

      expect(results.length).toBe(229)
      expect(results).toContainEqual(expect.objectContaining({
        provider: 'REMOTE_OK',
        publishedAt: Date.parse('2019-07-24T03:09:19-07:00'),
        company: 'Authority Partners',
        position: 'Business Analyst',
        tags: ['analyst'],
        url: 'https://remoteok.io/remote-jobs/74113'
      }))
      expect(results[0].description).toEqual(expect.stringContaining('We are looking for a Business Analyst to join our growing team! Seeking a talented individual who is passionate about using their analytical skills to understand complex systems and their quality assurance skills to ensure proven solutions for the business.'))
      expect(results[0].description).toEqual(expect.stringContaining('* Bachelor\'s degree in Business, Software Engineering or Computer Science, would be of great value, but if you’re passionate and have the experience that backs up your abilities, for us, talent outweighs degree every time.'))
    })

    it('handles when the target site is not responding', async () => {
      nock('https://remoteok.io')
        .get('/api')
        .reply(503)

      const provider = new RemoteOK()
      const results = await provider.fetch()
      expect(results.length).toBe(0)
    })
  })
})
