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

const Config = require('../src/Config')

test.group('Config', () => {
  test('get value for a given key from config store', (assert) => {
    const config = new Config()
    config.set('database.mysql.connection.host', 'localhost')
    const host = config.get('database.mysql.connection.host')
    assert.equal(host, 'localhost')
  })

  test('return default value when actual value does not exists', (assert) => {
    const config = new Config()
    const database = config.get('database.mysql.connection.database', 'adonis')
    assert.equal(database, 'adonis')
  })

  test('return actual value when it\'s falsy', (assert) => {
    const config = new Config()
    config.set('database.connection', false)
    const connection = config.get('database.connection', true)
    assert.equal(connection, false)
  })

  test('return undefined when default value is not defined', (assert) => {
    const config = new Config()
    const database = config.get('database.mysql.connection.database')
    assert.equal(database, undefined)
  })

  test('return resolved value when defined as reference', (assert) => {
    const config = new Config()
    config.set('database.mysqlProduction', 'self::database.mysql')
    config.set('database.mysql', { client: 'mysql' })
    const database = config.get('database.mysqlProduction')
    assert.equal(database.client, 'mysql')
  })

  test('set value for a given key', (assert) => {
    const config = new Config()
    config.set('database.mysql.connection.database', 'blog')
    const database = config.get('database.mysql.connection.database')
    assert.equal(database, 'blog')
  })

  test('should set mid level paths via key', (assert) => {
    const config = new Config()
    config.set('database.mysql', {
      connection: {
        host: '127.0.0.1'
      }
    })
    const host = config.get('database.mysql.connection.host')
    assert.equal(host, '127.0.0.1')
  })

  test('should return booleans as booleans', (assert) => {
    const config = new Config()
    config.set('database.mysql.debug', true)
    const debug = config.get('database.mysql.debug')
    assert.equal(debug, true)
  })

  test('merge values with the defaults', (assert) => {
    const config = new Config()
    config.set('database', {
      client: 'mysql'
    })
    const database = config.merge('database', {
      client: 'foo',
      connection: {
        host: '127.0.0.1',
        port: 3306
      }
    })
    assert.deepEqual(database, {
      client: 'mysql',
      connection: {
        host: '127.0.0.1',
        port: 3306
      }
    })
  })

  test('merge empty sets with user values', (assert) => {
    const config = new Config()
    config.set('database', {
      client: 'mysql',
      connection: {}
    })

    const database = config.merge('database', {
      client: 'foo',
      connection: {
        host: '127.0.0.1',
        port: 3306
      }
    }, (obj, src, key) => {
      if (key === 'connection') {
        return src
      }
    })

    assert.deepEqual(database, {
      client: 'mysql',
      connection: {}
    })
  })
})
