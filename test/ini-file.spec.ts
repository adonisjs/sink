/*
* @adonisjs/boilerplate-utils
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { join } from 'path'
import * as test from 'japa'
import * as ini from 'ini'
import { Filesystem } from '@adonisjs/dev-utils'

import { IniFile } from '../src/formats/IniFile'

const fs = new Filesystem(join(__dirname, '__app'))

test.group('Ini file', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  group.beforeEach(async () => {
    await fs.ensureRoot()
  })

  test('create ini file', async (assert) => {
    const file = new IniFile(fs.basePath, 'foo.ini')
    file.set('_global', { appName: 'hello-world' })
    file.commit()

    const contents = await fs.get('foo.ini')
    assert.deepEqual(ini.parse(contents), { appName: 'hello-world' })
  })

  test('define custom section in ini file', async (assert) => {
    const file = new IniFile(fs.basePath, 'foo.ini')
    file.set('foo', { appName: 'hello-world' })
    file.commit()

    const contents = await fs.get('foo.ini')
    assert.deepEqual(ini.parse(contents), { foo: { appName: 'hello-world' } })
  })

  test('update ini file', async (assert) => {
    await fs.add('foo.ini', ini.encode({ appName: 'hello-world', version: '1.0' }))

    const file = new IniFile(fs.basePath, 'foo.ini')
    file.set('_global', { appName: 'hello-universe' })
    file.commit()

    const contents = await fs.get('foo.ini')
    assert.deepEqual(ini.parse(contents), { appName: 'hello-universe' })
  })

  test('merge to ini file', async (assert) => {
    await fs.add('foo.ini', ini.encode({ appName: 'hello-world', version: '1.0' }))
    const file = new IniFile(fs.basePath, 'foo.ini')

    file.merge('_global', { appName: 'hello-universe' })
    file.commit()

    const contents = await fs.get('foo.ini')
    assert.deepEqual(ini.parse(contents), { appName: 'hello-universe', version: '1.0' })
  })

  test('merge to custom section in ini file', async (assert) => {
    await fs.add('foo.ini', ini.encode({ appName: 'hello-world', version: '1.0' }, { section: 'foo' }))

    const file = new IniFile(fs.basePath, 'foo.ini')
    file.merge('foo', { appName: 'hello-universe' })
    file.commit()

    const contents = await fs.get('foo.ini')
    assert.deepEqual(ini.parse(contents), { foo: { appName: 'hello-universe', version: '1.0' } })
  })

  test('unset section from ini file', async (assert) => {
    await fs.add('foo.ini', ini.encode({ appName: 'hello-world', version: '1.0' }))
    const file = new IniFile(fs.basePath, 'foo.ini')
    file.unset('_global')
    file.commit()

    const contents = await fs.get('foo.ini')
    assert.deepEqual(ini.parse(contents), {})
  })

  test('unset section value from ini file', async (assert) => {
    await fs.add('foo.ini', ini.encode({ appName: 'hello-world', version: '1.0' }))
    const file = new IniFile(fs.basePath, 'foo.ini')
    file.merge('_global', { version: undefined })
    file.commit()

    const contents = await fs.get('foo.ini')
    assert.deepEqual(ini.parse(contents), { appName: 'hello-world' })
  })

  test('delete ini file', async (assert) => {
    await fs.add('foo.ini', ini.encode({ appName: 'hello-world', version: '1.0' }))
    const file = new IniFile(fs.basePath, 'foo.ini')
    file.delete()

    const hasFile = await fs.fsExtra.exists('foo.ini')
    assert.isFalse(hasFile)
  })

  test('undo constructive commits on rollback', async (assert) => {
    await fs.add('foo.ini', ini.encode({ appName: 'hello-world', version: '1.0' }))

    const file = new IniFile(fs.basePath, 'foo.ini')
    file.merge('_global', { appName: 'hello-world' })
    file.rollback()

    const contents = await fs.get('foo.ini')
    assert.deepEqual(ini.parse(contents), { version: '1.0' })
  })

  test('do not touch destructive commits on rollbacks', async (assert) => {
    await fs.add('foo.ini', ini.encode({ appName: 'hello-world' }))

    const file = new IniFile(fs.basePath, 'foo.ini')
    file.unset('_global')
    file.rollback()

    const contents = await fs.get('foo.ini')
    assert.deepEqual(ini.parse(contents), { appName: 'hello-world' })
  })
})
