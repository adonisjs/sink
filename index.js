'use strict'

/*
 * adonis-sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const _ = require('lodash')
const Config = require('./src/Config')
const Helpers = require('./src/Helpers')
const Logger = require('./src/Logger')

const setupResolver = function (directories, appNamespace = 'App') {
  const defaultDirectories = {
    httpControllers: 'Controllers/Http',
    wsControllers: 'Controllers/Ws',
    models: 'Models',
    listeners: 'Listeners',
    exceptions: 'Exceptions',
    middleware: 'Middleware',
    commands: 'Commands'
  }

  const { resolver } = require('resolver')
  resolver.directories(_.merge(defaultDirectories, directories))
  resolver.appNamespace(appNamespace)
}

module.exports = { Config, Helpers, Logger, setupResolver }
