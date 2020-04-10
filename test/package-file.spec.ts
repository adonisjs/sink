/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import test from 'japa'
import { PackageJsonFile } from '../src/Files/Special/PackageJson'
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
    const pkg = new PackageJsonFile(fs.basePath)
    pkg.set('name', 'foo-app')
    pkg.commit()

    const contents = await fs.get('package.json')
    assert.deepEqual(JSON.parse(contents), { name: 'foo-app' })
  })

  test('unset existing values when down is called', async (assert) => {
    await fs.add('package.json', JSON.stringify({ name: 'foo' }))

    const pkg = new PackageJsonFile(fs.basePath)
    pkg.set('name', 'foo-app')
    pkg.rollback()

    const contents = await fs.get('package.json')
    assert.deepEqual(JSON.parse(contents), {})
  })

  test('add script', async (assert) => {
    const pkg = new PackageJsonFile(fs.basePath)
    pkg.setScript('test', 'japa')
    pkg.commit()

    const contents = await fs.get('package.json')
    assert.deepEqual(JSON.parse(contents), { scripts: { test: 'japa' } })
  })

  test('remove added script on down', async (assert) => {
    await fs.add('package.json', JSON.stringify({ scripts: { test: 'japa' } }))
    const pkg = new PackageJsonFile(fs.basePath)
    pkg.setScript('test', 'japa')
    pkg.rollback()

    const contents = await fs.get('package.json')
    assert.deepEqual(JSON.parse(contents), { scripts: {} })
  })

  test('append script', async (assert) => {
    await fs.add('package.json', JSON.stringify({ scripts: { test: 'japa' } }))
    const pkg = new PackageJsonFile(fs.basePath)
    pkg.appendScript('test', 'tsc')
    pkg.commit()

    const contents = await fs.get('package.json')
    assert.deepEqual(JSON.parse(contents), { scripts: { test: 'japa && tsc' } })
  })

  test('remove appended script on rollback', async (assert) => {
    await fs.add('package.json', JSON.stringify({ scripts: { test: 'japa && tsc' } }))
    const pkg = new PackageJsonFile(fs.basePath)
    pkg.appendScript('test', 'tsc')
    pkg.rollback()

    const contents = await fs.get('package.json')
    assert.deepEqual(JSON.parse(contents), { scripts: { test: 'japa' } })
  })

  test('prepend script', async (assert) => {
    await fs.add('package.json', JSON.stringify({ scripts: { test: 'japa' } }))
    const pkg = new PackageJsonFile(fs.basePath)
    pkg.prependScript('test', 'tsc')
    pkg.commit()

    const contents = await fs.get('package.json')
    assert.deepEqual(JSON.parse(contents), { scripts: { test: 'tsc && japa' } })
  })

  test('remove appended script on rollback', async (assert) => {
    await fs.add('package.json', JSON.stringify({ scripts: { test: 'tsc && japa' } }))
    const pkg = new PackageJsonFile(fs.basePath)
    pkg.prependScript('test', 'tsc')
    pkg.rollback()

    const contents = await fs.get('package.json')
    assert.deepEqual(JSON.parse(contents), { scripts: { test: 'japa' } })
  })

  test('install dev dependency', async (assert) => {
    await fs.add('package.json', JSON.stringify({ name: 'foo' }))
    const pkg = new PackageJsonFile(fs.basePath)
    pkg.install('lodash')
    pkg.commit()

    const contents = await fs.get('package.json')
    assert.property(JSON.parse(contents).devDependencies, 'lodash')
  }).timeout(0)

  test('uninstall dev dependency on rollback', async (assert) => {
    await fs.add('package.json', JSON.stringify({ name: 'foo', devDependencies: { lodash: '*' } }))
    const pkg = new PackageJsonFile(fs.basePath)
    pkg.install('lodash')
    pkg.rollback()

    const contents = await fs.get('package.json')
    assert.deepEqual(JSON.parse(contents), { name: 'foo', devDependencies: {} })
  }).timeout(0)

  test('uninstall dependency', async (assert) => {
    await fs.add('package.json', JSON.stringify({ name: 'foo', devDependencies: { lodash: '*' } }))
    const pkg = new PackageJsonFile(fs.basePath)
    pkg.uninstall('lodash')
    pkg.commit()

    const contents = await fs.get('package.json')
    assert.deepEqual(JSON.parse(contents), { name: 'foo', devDependencies: {} })
  }).timeout(0)

  test('do not install removed dependency on rollback', async (assert) => {
    await fs.add('package.json', JSON.stringify({ name: 'foo', devDependencies: { lodash: '*' } }))
    const pkg = new PackageJsonFile(fs.basePath)
    pkg.uninstall('lodash')
    pkg.rollback()

    const contents = await fs.get('package.json')
    assert.deepEqual(JSON.parse(contents), { name: 'foo', devDependencies: { lodash: '*' } })
  }).timeout(0)

  test('install given version of a package', async (assert) => {
    await fs.add('package.json', JSON.stringify({ name: 'foo' }))
    const pkg = new PackageJsonFile(fs.basePath)
    pkg.install('lodash', '1.0.0')
    const response = pkg.commit()
    assert.isUndefined(response)

    const contents = await fs.get('package.json')
    assert.equal(JSON.parse(contents).devDependencies.lodash, '^1.0.0')
  }).timeout(0)

  test('get list of dev & production installs', async (assert) => {
    await fs.add('package.json', JSON.stringify({ name: 'foo' }))
    const pkg = new PackageJsonFile(fs.basePath)

    pkg.install('lodash', '1.0.0', false)
    pkg.install('@adonisjs/core', 'latest', false)
    pkg.install('mrm-core')

    assert.deepEqual(pkg.getInstalls(false), {
      list: ['lodash', '@adonisjs/core'],
      versions: { lodash: '1.0.0' },
      dev: false,
    })

    assert.deepEqual(pkg.getInstalls(true), {
      list: ['mrm-core'],
      versions: {},
      dev: true,
    })
  }).timeout(0)

  test('get list of dev & production uninstalls', async (assert) => {
    await fs.add('package.json', JSON.stringify({ name: 'foo' }))
    const pkg = new PackageJsonFile(fs.basePath)
    pkg.uninstall('lodash', false)
    pkg.uninstall('mrm-core')

    assert.deepEqual(pkg.getUninstalls(false), {
      list: ['lodash'],
      dev: false,
    })

    assert.deepEqual(pkg.getUninstalls(true), {
      list: ['mrm-core'],
      dev: true,
    })
  }).timeout(0)

  test('return install errors from commit action', async (assert) => {
    await fs.add('package.json', JSON.stringify({ name: 'foo' }))
    const pkg = new PackageJsonFile(fs.basePath)
    pkg.install('sdasdjksadjkasdkja')

    const response = pkg.commit()
    assert.equal(response!.status, 1)

    const contents = await fs.get('package.json')
    assert.isUndefined(JSON.parse(contents).devDependencies)
  }).timeout(0)

  test('do not continue commit when one of the install command fails', async (assert) => {
    await fs.add('package.json', JSON.stringify({ name: 'foo' }))
    const pkg = new PackageJsonFile(fs.basePath)

    pkg.install('sdasdjksadjkasdkja')
    pkg.install('lodash', undefined, false)

    const response = pkg.commit()
    assert.equal(response!.status, 1)

    const contents = await fs.get('package.json')
    assert.isUndefined(JSON.parse(contents).devDependencies)
    assert.isUndefined(JSON.parse(contents).dependencies)
  }).timeout(0)

  test('execute callback before installing packages', async (assert) => {
    assert.plan(2)
    await fs.add('package.json', JSON.stringify({ name: 'foo' }))
    const pkg = new PackageJsonFile(fs.basePath)

    pkg.install('lodash')
    pkg.beforeInstall((list, dev) => {
      assert.deepEqual(list, ['lodash'])
      assert.isTrue(dev)
    })

    pkg.commit()
  }).timeout(0)

  test('execute callback before uninstalling packages', async (assert) => {
    assert.plan(2)
    await fs.add('package.json', JSON.stringify({ name: 'foo' }))
    const pkg = new PackageJsonFile(fs.basePath)

    pkg.install('lodash')
    pkg.beforeUninstall((list, dev) => {
      assert.deepEqual(list, ['lodash'])
      assert.isTrue(dev)
    })

    pkg.rollback()
  }).timeout(0)

  test('install given version of a package asynchronously', async (assert) => {
    await fs.add('package.json', JSON.stringify({ name: 'foo' }))
    const pkg = new PackageJsonFile(fs.basePath)
    pkg.install('lodash', '1.0.0')
    const response = await pkg.commitAsync()
    assert.isUndefined(response)

    const contents = await fs.get('package.json')
    assert.equal(JSON.parse(contents).devDependencies.lodash, '^1.0.0')
  }).timeout(0)

  test('return install errors from asynchronous commit action', async (assert) => {
    await fs.add('package.json', JSON.stringify({ name: 'foo' }))
    const pkg = new PackageJsonFile(fs.basePath)
    pkg.install('sdasdjksadjkasdkja')

    const response = await pkg.commitAsync()
    assert.equal(response!.status, 1)

    const contents = await fs.get('package.json')
    assert.isUndefined(JSON.parse(contents).devDependencies)
  }).timeout(0)

  test('do not continue commit when one of the asynchronous install fails', async (assert) => {
    await fs.add('package.json', JSON.stringify({ name: 'foo' }))
    const pkg = new PackageJsonFile(fs.basePath)

    pkg.install('sdasdjksadjkasdkja')
    pkg.install('lodash', undefined, false)

    const response = await pkg.commitAsync()
    assert.equal(response!.status, 1)

    const contents = await fs.get('package.json')
    assert.isUndefined(JSON.parse(contents).devDependencies)
    assert.isUndefined(JSON.parse(contents).dependencies)
  }).timeout(0)
})
