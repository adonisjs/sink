/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { join } from 'path'
import * as test from 'japa'
import * as Yaml from 'yaml'
import { Filesystem } from '@adonisjs/dev-utils'

import { YamlFile } from '../src/formats/YamlFile'

const fs = new Filesystem(join(__dirname, '__app'))

test.group('Yaml file', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  group.beforeEach(async () => {
    await fs.ensureRoot()
  })

  test('create json file', async (assert) => {
    const file = new YamlFile(fs.basePath, 'foo.yml')
    file.set('appName', 'hello-world')
    file.commit()

    const contents = await fs.get('foo.yml')
    assert.deepEqual(Yaml.parse(contents), { appName: 'hello-world' })
  })

  test('update json file', async (assert) => {
    await fs.add('foo.yml', Yaml.stringify({ appName: 'hello-world', version: '1.0' }))
    const file = new YamlFile(fs.basePath, 'foo.yml')
    file.set('appName', 'hello-universe')
    file.unset('version')
    file.commit()

    const contents = await fs.get('foo.yml')
    assert.deepEqual(Yaml.parse(contents), { appName: 'hello-universe' })
  })

  test('delete json file', async (assert) => {
    await fs.add('foo.yml', Yaml.stringify({ appName: 'hello-world', version: '1.0' }))
    const file = new YamlFile(fs.basePath, 'foo.yml')
    file.delete()

    const hasFile = await fs.fsExtra.exists('foo.yml')
    assert.isFalse(hasFile)
  })

  test('undo constructive commits on rollback', async (assert) => {
    await fs.add('foo.yml', Yaml.stringify({ appName: 'hello-world' }))

    const file = new YamlFile(fs.basePath, 'foo.yml')
    file.set('appName', 'hello-world')
    file.rollback()

    const contents = await fs.get('foo.yml')
    assert.deepEqual(Yaml.parse(contents), {})
  })

  test('do not touch destructive commits on rollbacks', async (assert) => {
    await fs.add('foo.yml', Yaml.stringify({ appName: 'hello-world' }))

    const file = new YamlFile(fs.basePath, 'foo.yml')
    file.unset('appName')
    file.rollback()

    const contents = await fs.get('foo.yml')
    assert.deepEqual(Yaml.parse(contents), { appName: 'hello-world' })
  })
})
