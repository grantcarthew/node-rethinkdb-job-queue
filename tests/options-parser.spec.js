const test = require('tape')
const parser = require('../src/options-parser')
const options = {}
const optionsConnectDefault = {
  blobStoreRoot: '/tmp/blobs',
  idType: 'cuid',
  dirDepth: 3,
  dirWidth: 1000
}
const optionsCreateDefault = {
  blobStoreRoot: '/tmp/blobs',
  idType: 'uuid',
  dirDepth: 3,
  dirWidth: 1000
}
const optNonDefault = {
  blobStoreRoot: '/tmp/blobs',
  idType: 'cuid',
  dirDepth: 6,
  dirWidth: 6000
}

test('options-parser tests', (t) => {
  mock()

  t.plan(11)
  t.throws(() => { parser() }, 'Throws error if no options passed')
  t.throws(() => { parser('string') }, 'Throws error if string option passed')
  t.throws(() => { parser(options) }, 'Throws error if no blobStoreRoot option')
  options.blobStoreRoot = '/tmp/blobs'
  t.throws(() => { parser(options) }, 'Throws error if no idType option')
  options.idType = 'invalid'
  t.throws(() => { parser(options) }, 'Throws error if invalid idType option')
  options.idType = 'cuid'
  options.dirDepth = 0
  t.throws(() => { parser(options) }, 'Throws error if invalid min dirDepth option')
  options.dirDepth = 11
  t.throws(() => { parser(options) }, 'Throws error if invalid max dirDepth option')
  delete options.dirDepth
  t.deepEqual(parser(options), optsCuidDefaults, 'Return options for CUID with defaults')
  options.idType = 'uuid'
  t.deepEqual(parser(options), optsUuidDefaults, 'Return options for UUID with defaults')
  t.deepEqual(parser(optNonDefault), optNonDefault, 'Return options with non-defaults')
  t.ok(fs.existsSync(options.blobStoreRoot), 'blobStoreRoot path created')

  mock.restore()
})
