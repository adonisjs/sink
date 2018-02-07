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
const defaultDirectories = require('./src/directories')
const Config = require('./src/Config')
const Helpers = require('./src/Helpers')
const Logger = require('./src/Logger')
const Env = require('./src/Env')

const setupResolver = function (directories, appNamespace = 'App') {
  const { resolver } = require('@adonisjs/fold')
  resolver.directories(_.merge(defaultDirectories, directories))
  resolver.appNamespace(appNamespace)
}

module.exports = { Config, Helpers, Logger, setupResolver, Env }
