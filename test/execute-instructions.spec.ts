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
import { Filesystem } from '@adonisjs/dev-utils'
import { Application } from '@poppinss/application'

import { executeInstructions } from '../src/executeInstructions'

const fs = new Filesystem(join(__dirname, '__app'))

test.group('AdonisRc file', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  group.beforeEach(async () => {
    await fs.ensureRoot()
  })

  test('ignore when package.json doesnt give adonisjs instructions field', async (assert) => {
    await fs.add('package.json', JSON.stringify({
      name: 'my-app',
      dependencies: {
        '@fake/app': '^1.0.0',
      },
    }))

    await fs.add('node_modules/@fake/app/package.json', JSON.stringify({
      name: '@fake/app',
      version: '1.0.0',
    }))

    const application = new Application(fs.basePath, {
      singleton () {},
    }, {}, '1.0.0')

    const completed = await executeInstructions('@fake/app', fs.basePath, application)
    assert.isTrue(completed)
  })

  test('raise error when defined and instructions file is missing', async (assert) => {
    await fs.add('package.json', JSON.stringify({
      name: 'my-app',
      dependencies: {
        '@fake/app': '^1.0.0',
      },
    }))

    await fs.add('node_modules/@fake/app/package.json', JSON.stringify({
      name: '@fake/app',
      version: '1.0.0',
      adonisjs: {
        instructions: './foo.js',
      },
    }))

    const application = new Application(fs.basePath, {
      singleton () {},
    }, {}, '1.0.0')

    const completed = await executeInstructions('@fake/app', fs.basePath, application)
    assert.isFalse(completed)
  })

  test('execute instructions when defined', async (assert) => {
    await fs.add('package.json', JSON.stringify({
      name: 'my-app',
      dependencies: {
        '@fake/app': '^1.0.0',
      },
    }))

    fs.add('node_modules/@fake/app/foo.js', `module.exports = function () {
    }`)

    await fs.add('node_modules/@fake/app/package.json', JSON.stringify({
      name: '@fake/app',
      version: '1.0.0',
      adonisjs: {
        instructions: './foo.js',
      },
    }))

    const application = new Application(fs.basePath, {
      singleton () {},
    }, {}, '1.0.0')

    const completed = await executeInstructions('@fake/app', fs.basePath, application)
    assert.isTrue(completed)
  })

  test('execute instructions with esm default export', async (assert) => {
    await fs.add('package.json', JSON.stringify({
      name: 'my-app',
      dependencies: {
        '@fake/app': '^1.0.0',
      },
    }))

    fs.add('node_modules/@fake/app/foo.js', `
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.default = function foo () {};
    `)

    await fs.add('node_modules/@fake/app/package.json', JSON.stringify({
      name: '@fake/app',
      version: '1.0.0',
      adonisjs: {
        instructions: './foo.js',
      },
    }))

    const application = new Application(fs.basePath, {
      singleton () {},
    }, {}, '1.0.0')

    const completed = await executeInstructions('@fake/app', fs.basePath, application)
    assert.isTrue(completed)
  })
})
