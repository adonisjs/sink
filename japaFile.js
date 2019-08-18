require('ts-node/register')

const { configure } = require('japa')
configure({
  files: ['test/**/*.spec.ts'],
  before: [() => {
    require('./src/disableLogger')
  }]
})
