const Reqlite = require('reqlite')
console.log('Starting RethinkDB in memory (port: 28016)...')
const server = new Reqlite({
  silent: true,
  'driver-port': 28016
})
