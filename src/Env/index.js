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

/**
 * @module Adonis
 * @submodule sink
 */

/**
 * Manages env values by reading and writing values
 * to `process.env`
 *
 * @class Env
 * @constructor
 */
class Env {
  constructor (processValues = {}) {
    _.each(processValues, (value, key) => {
      this.set(key, value)
    })
  }

  /**
   * Returns the value from process.env and if value
   * is undefined then default value is returned
   *
   * @method get
   *
   * @param  {String} key
   * @param  {Mixed} defaultValue
   *
   * @return {Mixed}
   */
  get (key, defaultValue) {
    return _.get(process.env, key, defaultValue)
  }

  /**
   * Update/Set value on process.env variables
   *
   * @method set
   *
   * @param  {String} key
   * @param  {Mixed} value
   */
  set (key, value) {
    _.set(process.env, key, value)
  }
}

module.exports = Env
