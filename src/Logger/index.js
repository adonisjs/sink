'use strict'

/*
 * adonis-sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const util = require('util')
const _ = require('lodash')

class Logger {
  constructor () {
    this._lines = {
      emergency: [],
      alert: [],
      critical: [],
      error: [],
      warn: [],
      notice: [],
      info: [],
      debug: []
    }
  }

  /**
   * Log emergency message.
   *
   * @method emergency
   *
   * @param  {String}    message
   * @param  {...Spread} args
   *
   * @return {void}
   */
  emergency (message, ...args) {
    this._lines.emergency.push(util.format(message, ...args))
  }

  /**
   * Log alert message.
   *
   * @method alert
   *
   * @param  {String}    message
   * @param  {...Spread} args
   *
   * @return {void}
   */
  alert (message, ...args) {
    this._lines.alert.push(util.format(message, ...args))
  }

  /**
   * Log critical message.
   *
   * @method critical
   *
   * @param  {String}    message
   * @param  {...Spread} args
   *
   * @return {void}
   */
  critical (message, ...args) {
    this._lines.critical.push(util.format(message, ...args))
  }

  /**
   * Log error message.
   *
   * @method error
   *
   * @param  {String}    message
   * @param  {...Spread} args
   *
   * @return {void}
   */
  error (message, ...args) {
    this._lines.error.push(util.format(message, ...args))
  }

  /**
   * Log warning message.
   *
   * @method warn
   *
   * @param  {String}    message
   * @param  {...Spread} args
   *
   * @return {void}
   */
  warn (message, ...args) {
    this._lines.warn.push(util.format(message, ...args))
  }

  /**
   * Log notice message.
   *
   * @method notice
   *
   * @param  {String}    message
   * @param  {...Spread} args
   *
   * @return {void}
   */
  notice (message, ...args) {
    this._lines.notice.push(util.format(message, ...args))
  }

  /**
   * Log info message.
   *
   * @method info
   *
   * @param  {String}    message
   * @param  {...Spread} args
   *
   * @return {void}
   */
  info (message, ...args) {
    this._lines.info.push(util.format(message, ...args))
  }

  /**
   * Log debug message.
   *
   * @method debug
   *
   * @param  {String}    message
   * @param  {...Spread} args
   *
   * @return {void}
   */
  debug (message, ...args) {
    this._lines.debug.push(util.format(message, ...args))
  }

  /**
   * Returns whether logger has a message for a given
   * type or not
   *
   * @method has
   *
   * @param  {String}   type
   * @param  {String}   message
   *
   * @return {Boolean}
   */
  has (type, message) {
    return this._lines[type].indexOf(message) > -1
  }

  /**
   * Find whether or not a message exists for a
   * given type.
   *
   * @method contains
   *
   * @param  {String} type
   * @param  {String} message
   *
   * @return {Boolean}
   */
  contains (type, message) {
    return !!_.find(this._lines[type], (line) => _.includes(line, message))
  }
}

module.exports = Logger
