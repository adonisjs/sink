/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import * as test from 'japa'
import { PackageFile } from '../src/files/PackageFile'
import { Filesystem } from '@adonisjs/dev-utils'
import { join } from 'path'

const fs = new Filesystem(join(__dirname, '__app'))

test.group('Package file', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  group.beforeEach(async () => {
    await fs.ensureRoot()
  })

  test('create package file when missing', async (assert) => {
    const pkg = new PackageFile(fs.basePath)
    pkg.set('name', 'foo-app')
    pkg.commit()

    const contents = await fs.get('package.json')
    assert.deepEqual(JSON.parse(contents), { name: 'foo-app' })
  })

  test('unset existing values when down is called', async (assert) => {
    await fs.add('package.json', JSON.stringify({ name: 'foo' }))

    const pkg = new PackageFile(fs.basePath)
    pkg.set('name', 'foo-app')
    pkg.rollback()

    const contents = await fs.get('package.json')
    assert.deepEqual(JSON.parse(contents), {})
  })

  test('add script', async (assert) => {
    const pkg = new PackageFile(fs.basePath)
    pkg.setScript('test', 'japa')
    pkg.commit()

    const contents = await fs.get('package.json')
    assert.deepEqual(JSON.parse(contents), { scripts: { test: 'japa' } })
  })

  test('remove added script on down', async (assert) => {
    await fs.add('package.json', JSON.stringify({ scripts: { test: 'japa' } }))
    const pkg = new PackageFile(fs.basePath)
    pkg.setScript('test', 'japa')
    pkg.rollback()

    const contents = await fs.get('package.json')
    assert.deepEqual(JSON.parse(contents), { scripts: {} })
  })

  test('append script', async (assert) => {
    await fs.add('package.json', JSON.stringify({ scripts: { test: 'japa' } }))
    const pkg = new PackageFile(fs.basePath)
    pkg.appendScript('test', 'tsc')
    pkg.commit()

    const contents = await fs.get('package.json')
    assert.deepEqual(JSON.parse(contents), { scripts: { test: 'japa && tsc' } })
  })

  test('remove appended script on rollback', async (assert) => {
    await fs.add('package.json', JSON.stringify({ scripts: { test: 'japa && tsc' } }))
    const pkg = new PackageFile(fs.basePath)
    pkg.appendScript('test', 'tsc')
    pkg.rollback()

    const contents = await fs.get('package.json')
    assert.deepEqual(JSON.parse(contents), { scripts: { test: 'japa' } })
  })

  test('prepend script', async (assert) => {
    await fs.add('package.json', JSON.stringify({ scripts: { test: 'japa' } }))
    const pkg = new PackageFile(fs.basePath)
    pkg.prependScript('test', 'tsc')
    pkg.commit()

    const contents = await fs.get('package.json')
    assert.deepEqual(JSON.parse(contents), { scripts: { test: 'tsc && japa' } })
  })

  test('remove appended script on rollback', async (assert) => {
    await fs.add('package.json', JSON.stringify({ scripts: { test: 'tsc && japa' } }))
    const pkg = new PackageFile(fs.basePath)
    pkg.prependScript('test', 'tsc')
    pkg.rollback()

    const contents = await fs.get('package.json')
    assert.deepEqual(JSON.parse(contents), { scripts: { test: 'japa' } })
  })

  test('install dev dependency', async (assert) => {
    await fs.add('package.json', JSON.stringify({ name: 'foo' }))
    const pkg = new PackageFile(fs.basePath)
    pkg.install('lodash')
    pkg.commit()

    const contents = await fs.get('package.json')
    assert.property(JSON.parse(contents).devDependencies, 'lodash')
  }).timeout(0)

  test('uninstall dev dependency on rollback', async (assert) => {
    await fs.add('package.json', JSON.stringify({ name: 'foo', devDependencies: { lodash: '*' } }))
    const pkg = new PackageFile(fs.basePath)
    pkg.install('lodash')
    pkg.rollback()

    const contents = await fs.get('package.json')
    assert.deepEqual(JSON.parse(contents), { name: 'foo', devDependencies: {} })
  }).timeout(0)

  test('uninstall dependency', async (assert) => {
    await fs.add('package.json', JSON.stringify({ name: 'foo', devDependencies: { lodash: '*' } }))
    const pkg = new PackageFile(fs.basePath)
    pkg.uninstall('lodash')
    pkg.commit()

    const contents = await fs.get('package.json')
    assert.deepEqual(JSON.parse(contents), { name: 'foo', devDependencies: {} })
  }).timeout(0)

  test('do not install removed dependency on rollback', async (assert) => {
    await fs.add('package.json', JSON.stringify({ name: 'foo', devDependencies: { lodash: '*' } }))
    const pkg = new PackageFile(fs.basePath)
    pkg.uninstall('lodash')
    pkg.rollback()

    const contents = await fs.get('package.json')
    assert.deepEqual(JSON.parse(contents), { name: 'foo', devDependencies: { lodash: '*' } })
  }).timeout(0)

  test('install given version of a package', async (assert) => {
    await fs.add('package.json', JSON.stringify({ name: 'foo' }))
    const pkg = new PackageFile(fs.basePath)
    pkg.install('lodash', '1.0.0')
    pkg.commit()

    const contents = await fs.get('package.json')
    assert.equal(JSON.parse(contents).devDependencies.lodash, '^1.0.0')
  }).timeout(0)

  test('get list of dev & production dependencies', async (assert) => {
    await fs.add('package.json', JSON.stringify({ name: 'foo' }))
    const pkg = new PackageFile(fs.basePath)
    pkg.install('lodash', '1.0.0', false)
    pkg.install('@adonisjs/core', 'latest', false)
    pkg.install('mrm-core')

    assert.deepEqual(pkg.getDependencies(false), {
      list: ['lodash', '@adonisjs/core'],
      versions: { lodash: '1.0.0' },
    })

    assert.deepEqual(pkg.getDependencies(true), {
      list: ['mrm-core'],
      versions: {},
    })
  }).timeout(0)
})
