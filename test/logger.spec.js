'use strict'

/*
 * adonis-sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const test = require('japa')
const Logger = require('../src/Logger')

test.group('Logger', (group) => {
  group.beforeEach(() => {
    this.logger = new Logger()
  })

  test('should log info message', (assert) => {
    this.logger.info('hello world')
    assert.equal(this.logger._lines.info[0], 'hello world')
  })

  test('should log info message with sprintf', (assert) => {
    this.logger.info('hello %s', 'world')
    assert.equal(this.logger._lines.info[0], 'hello world')
  })

  test('find if a message was logged', (assert) => {
    this.logger.warn('hello %s', 'world')
    assert.isTrue(this.logger.has('warn', 'hello world'))
  })

  test('return false when message was not logged', (assert) => {
    this.logger.warn('hello %s', 'world')
    assert.isFalse(this.logger.has('error', 'hello world'))
  })

  test('return true when part of logged message matches', (assert) => {
    this.logger.debug('profile %j', { name: 'virk', age: 22 })
    assert.isTrue(this.logger.contains('debug', 'profile {"name"'))
  })
})
