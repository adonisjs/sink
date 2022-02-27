/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { join } from 'path'
import { Filesystem } from '@poppinss/dev-utils'

import { JsonFile } from '../src/Files/Formats/Json'

const fs = new Filesystem(join(__dirname, '__app'))

test.group('Json file', (group) => {
  group.each.teardown(async () => {
    await fs.cleanup()
  })

  group.each.setup(async () => {
    await fs.ensureRoot()
  })

  test('create json file', async ({ assert }) => {
    const file = new JsonFile(fs.basePath, 'foo.json')
    file.set('appName', 'hello-world')
    file.commit()

    const contents = await fs.get('foo.json')
    assert.deepEqual(JSON.parse(contents), { appName: 'hello-world' })
  })

  test('update json file', async ({ assert }) => {
    await fs.add('foo.json', JSON.stringify({ appName: 'hello-world', version: '1.0' }))
    const file = new JsonFile(fs.basePath, 'foo.json')
    file.set('appName', 'hello-universe')
    file.unset('version')
    file.commit()

    const contents = await fs.get('foo.json')
    assert.deepEqual(JSON.parse(contents), { appName: 'hello-universe' })
  })

  test('delete json file', async ({ assert }) => {
    await fs.add('foo.json', JSON.stringify({ appName: 'hello-world', version: '1.0' }))
    const file = new JsonFile(fs.basePath, 'foo.json')
    file.delete()

    const hasFile = await fs.fsExtra.pathExists('foo.json')
    assert.isFalse(hasFile)
  })

  test('undo constructive commits on rollback', async ({ assert }) => {
    await fs.add('foo.json', JSON.stringify({ appName: 'hello-world' }))

    const file = new JsonFile(fs.basePath, 'foo.json')
    file.set('appName', 'hello-world')
    file.rollback()

    const contents = await fs.get('foo.json')
    assert.deepEqual(JSON.parse(contents), {})
  })

  test('do not touch destructive commits on rollbacks', async ({ assert }) => {
    await fs.add('foo.json', JSON.stringify({ appName: 'hello-world' }))

    const file = new JsonFile(fs.basePath, 'foo.json')
    file.unset('appName')
    file.rollback()

    const contents = await fs.get('foo.json')
    assert.deepEqual(JSON.parse(contents), { appName: 'hello-world' })
  })
})
