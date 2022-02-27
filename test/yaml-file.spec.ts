/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'path'
import { test } from '@japa/runner'
import Yaml from 'yaml'
import { Filesystem } from '@poppinss/dev-utils'

import { YamlFile } from '../src/Files/Formats/Yaml'

const fs = new Filesystem(join(__dirname, '__app'))

test.group('Yaml file', (group) => {
  group.each.teardown(async () => {
    await fs.cleanup()
  })

  group.each.setup(async () => {
    await fs.ensureRoot()
  })

  test('create json file', async ({ assert }) => {
    const file = new YamlFile(fs.basePath, 'foo.yml')
    file.set('appName', 'hello-world')
    file.commit()

    const contents = await fs.get('foo.yml')
    assert.deepEqual(Yaml.parse(contents), { appName: 'hello-world' })
  })

  test('update json file', async ({ assert }) => {
    await fs.add('foo.yml', Yaml.stringify({ appName: 'hello-world', version: '1.0' }))
    const file = new YamlFile(fs.basePath, 'foo.yml')
    file.set('appName', 'hello-universe')
    file.unset('version')
    file.commit()

    const contents = await fs.get('foo.yml')
    assert.deepEqual(Yaml.parse(contents), { appName: 'hello-universe' })
  })

  test('delete json file', async ({ assert }) => {
    await fs.add('foo.yml', Yaml.stringify({ appName: 'hello-world', version: '1.0' }))
    const file = new YamlFile(fs.basePath, 'foo.yml')
    file.delete()

    const hasFile = await fs.fsExtra.pathExists('foo.yml')
    assert.isFalse(hasFile)
  })

  test('undo constructive commits on rollback', async ({ assert }) => {
    await fs.add('foo.yml', Yaml.stringify({ appName: 'hello-world' }))

    const file = new YamlFile(fs.basePath, 'foo.yml')
    file.set('appName', 'hello-world')
    file.rollback()

    const contents = await fs.get('foo.yml')
    assert.deepEqual(Yaml.parse(contents), {})
  })

  test('do not touch destructive commits on rollbacks', async ({ assert }) => {
    await fs.add('foo.yml', Yaml.stringify({ appName: 'hello-world' }))

    const file = new YamlFile(fs.basePath, 'foo.yml')
    file.unset('appName')
    file.rollback()

    const contents = await fs.get('foo.yml')
    assert.deepEqual(Yaml.parse(contents), { appName: 'hello-world' })
  })
})
