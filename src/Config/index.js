'use strict'

/**
 * adonis-sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const _ = require('lodash')

/**
 * The Adonis framework is the core module containing all the required
 * classes to run an HTTP server.
 *
 * @module Adonis
 * @submodule sink
 */

/**
 * Manages configuration by recursively reading all
 * `.js` files from the `config` folder.
 *
 * @class Config
 * @constructor
 */
class Config {
  constructor () {
    this._config = {}
  }

  /**
   * Get value for a given key from the config store. Nested
   * values can be accessed via (dot notation). Values
   * referenced with `self::` are further resolved.
   *
   * @since 1.0.0
   * @method get
   *
   * @param  {String} key
   * @param  {Mixed} [defaultValue]
   *
   * @return {Mixed}
   *
   * @example
   * ```
   * Config.get('database.mysql')
   * ```
   */
  get (key, defaultValue) {
    const value = _.get(this._config, key, defaultValue)
    if (typeof (value) === 'string' && value.startsWith('self::')) {
      return this.get(value.replace('self::', ''))
    }
    return value
  }

  /**
   * Merge default values with the resolved values.
   * This is to provide a default set of values
   * when it does not exists.
   *
   * @method merge
   *
   * @param  {String} key
   * @param  {Object} defaultValues
   *
   * @return {Object}
   */
  merge (key, defaultValues) {
    const value = _.get(this._config, key, {})
    return _.mergeWith(defaultValues, value, (base, value) => typeof (value) === 'undefined' ? base : value)
  }

  /**
   * Update value for a given key inside the config store. If
   * value does not exists it will be created.
   *
   * ## Note
   * This method updates the value in memory and not on the
   * file system.
   *
   * @since 1.0.0
   * @method set
   *
   * @param  {String} key
   * @param  {Mixed} value
   *
   * @example
   * ```
   * Config.set('database.mysql.host', '127.0.0.1')
   *
   * // later get the value
   * Config.get('database.mysql.host')
   * ```
   */
  set (key, value) {
    _.set(this._config, key, value)
  }
}

module.exports = Config
