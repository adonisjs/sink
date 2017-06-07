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

const Env = require('../src/Env')

test.group('Env', () => {
  test('merge constructor values to process.env', (assert) => {
    const env = new Env({ USERNAME: 'virk' })
    assert.equal(env.get('USERNAME'), 'virk')
  })

  test('get value for a given key from process.env', (assert) => {
    const env = new Env()
    process.env.PWD = process.cwd()
    assert.equal(env.get('PWD'), process.cwd())
  })

  test('return default value when actual value does not exists', (assert) => {
    const env = new Env()
    assert.equal(env.get('TESTING', 'nope'), 'nope')
  })

  test('set value for a given key', (assert) => {
    const env = new Env()
    env.set('TESTING', 'yup')
    assert.equal(env.get('TESTING', 'nope'), 'yup')
  })
})
