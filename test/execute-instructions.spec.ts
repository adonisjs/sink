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
import { Application } from '@adonisjs/application'

import { Instructions } from '../src/Tasks/Instructions'

const fs = new Filesystem(join(__dirname, '__app'))

test.group('Execute instructions', (group) => {
  group.each.teardown(async () => {
    await fs.cleanup()
  })

  group.each.setup(async () => {
    await fs.ensureRoot()
  })

  test('ignore when package.json doesnt give adonisjs instructions field', async ({ assert }) => {
    await fs.add(
      'package.json',
      JSON.stringify({
        name: 'my-app',
        dependencies: {
          '@fake/app': '^1.0.0',
        },
      })
    )

    await fs.add(
      'node_modules/@fake/app/package.json',
      JSON.stringify({
        name: '@fake/app',
        version: '1.0.0',
      })
    )

    const application = new Application(fs.basePath, 'web', {})
    const completed = await new Instructions('@fake/app', fs.basePath, application, true).execute()
    assert.isTrue(completed)
  })

  test('raise error when instructions file is missing', async ({ assert }) => {
    assert.plan(1)

    await fs.add(
      'package.json',
      JSON.stringify({
        name: 'my-app',
        dependencies: {
          '@fake/app': '^1.0.0',
        },
      })
    )

    await fs.add(
      'node_modules/@fake/app/package.json',
      JSON.stringify({
        name: '@fake/app',
        version: '1.0.0',
        adonisjs: {
          instructions: './foo.js',
        },
      })
    )

    const application = new Application(fs.basePath, 'web', {})

    try {
      await new Instructions('@fake/app', fs.basePath, application, true).execute()
    } catch ({ message }) {
      assert.match(message, /Cannot find module/)
    }
  })

  test('execute instructions when defined', async ({ assert }) => {
    await fs.add(
      'package.json',
      JSON.stringify({
        name: 'my-app',
        dependencies: {
          '@fake/app': '^1.0.0',
        },
      })
    )

    fs.add(
      'node_modules/@fake/app/foo.js',
      `module.exports = function () {
    }`
    )

    await fs.add(
      'node_modules/@fake/app/package.json',
      JSON.stringify({
        name: '@fake/app',
        version: '1.0.0',
        adonisjs: {
          instructions: './foo.js',
        },
      })
    )

    const application = new Application(fs.basePath, 'web', {})
    const completed = await new Instructions('@fake/app', fs.basePath, application, true).execute()
    assert.isTrue(completed)
  })

  test('execute instructions with esm default export', async ({ assert }) => {
    await fs.add(
      'package.json',
      JSON.stringify({
        name: 'my-app',
        dependencies: {
          '@fake/app': '^1.0.0',
        },
      })
    )

    fs.add(
      'node_modules/@fake/app/foo.js',
      `
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.default = function foo () {};
    `
    )

    await fs.add(
      'node_modules/@fake/app/package.json',
      JSON.stringify({
        name: '@fake/app',
        version: '1.0.0',
        adonisjs: {
          instructions: './foo.js',
        },
      })
    )

    const application = new Application(fs.basePath, 'web', {})
    const completed = await new Instructions('@fake/app', fs.basePath, application, true).execute()
    assert.isTrue(completed)
  })

  test('execute instructions set env variables in .env file', async ({ assert }) => {
    await fs.add(
      'package.json',
      JSON.stringify({
        name: 'my-app',
        dependencies: {
          '@fake/app': '^1.0.0',
        },
      })
    )

    await fs.add(
      'node_modules/@fake/app/package.json',
      JSON.stringify({
        name: '@fake/app',
        version: '1.0.0',
        adonisjs: {
          env: {
            PORT: '3333',
          },
        },
      })
    )

    const application = new Application(fs.basePath, 'web', {})
    const completed = await new Instructions('@fake/app', fs.basePath, application, true).execute()
    assert.isTrue(completed)

    const envContents = await fs.get('.env')
    assert.deepEqual(envContents.trim(), 'PORT=3333')
  })

  test('execute instructions open instructions md file', async ({ assert }) => {
    await fs.add(
      'package.json',
      JSON.stringify({
        name: 'my-app',
        dependencies: {
          '@fake/app': '^1.0.0',
        },
      })
    )

    await fs.add('node_modules/@fake/app/foo.md', 'Hello')

    await fs.add(
      'node_modules/@fake/app/package.json',
      JSON.stringify({
        name: '@fake/app',
        version: '1.0.0',
        adonisjs: {
          instructionsMd: 'foo.md',
        },
      })
    )

    const application = new Application(fs.basePath, 'web', {})
    const completed = await new Instructions('@fake/app', fs.basePath, application, true)
      .setDisplay('browser')
      .execute()
    assert.isTrue(completed)
  }).skip(!!process.env.CI)

  test('execute instructions display instructions md in browser', async ({ assert }) => {
    await fs.add(
      'package.json',
      JSON.stringify({
        name: 'my-app',
        dependencies: {
          '@fake/app': '^1.0.0',
        },
      })
    )

    await fs.add('node_modules/@fake/app/foo.md', '# Hello world')

    await fs.add(
      'node_modules/@fake/app/package.json',
      JSON.stringify({
        name: '@fake/app',
        version: '1.0.0',
        adonisjs: {
          instructionsMd: 'foo.md',
        },
      })
    )

    const application = new Application(fs.basePath, 'web', {})
    const completed = await new Instructions('@fake/app', fs.basePath, application, true)
      .setDisplay('terminal')
      .execute()

    assert.isTrue(completed)
  }).skip(!!process.env.CI)

  test('execute instructions copy templates', async ({ assert }) => {
    await fs.add(
      'package.json',
      JSON.stringify({
        name: 'my-app',
        dependencies: {
          '@fake/app': '^1.0.0',
        },
      })
    )

    await fs.add('node_modules/@fake/app/config/app.txt', 'export const config = { app: true }')

    await fs.add(
      'node_modules/@fake/app/package.json',
      JSON.stringify({
        name: '@fake/app',
        version: '1.0.0',
        adonisjs: {
          templates: {
            basePath: './config',
            config: ['app.txt'],
          },
        },
      })
    )

    const application = new Application(fs.basePath, 'web', {
      directories: new Map([['config', 'config']]),
    })

    const completed = await new Instructions('@fake/app', fs.basePath, application, true).execute()
    assert.isTrue(completed)

    const configContents = await fs.get('config/app.ts')
    assert.deepEqual(configContents.trim(), 'export const config = { app: true }')
  })

  test('define commands inside .adonisrc.json file', async ({ assert }) => {
    await fs.add(
      'node_modules/@fake/app/package.json',
      JSON.stringify({
        name: '@fake/app',
        version: '1.0.0',
        adonisjs: {
          commands: ['./commands/Make'],
        },
      })
    )

    const application = new Application(fs.basePath, 'web', {})
    const completed = await new Instructions('@fake/app', fs.basePath, application, true).execute()
    assert.isTrue(completed)

    const rcContents = await fs.fsExtra.readJSON(join(fs.basePath, '.adonisrc.json'))
    assert.deepEqual(rcContents, {
      commands: ['./commands/Make'],
    })
  })

  test('define types inside tsconfig.json file', async ({ assert }) => {
    await fs.add(
      'node_modules/@fake/app/package.json',
      JSON.stringify({
        name: '@fake/app',
        version: '1.0.0',
        adonisjs: {
          types: '@adonisjs/core',
        },
      })
    )

    const application = new Application(fs.basePath, 'web', {})
    const completed = await new Instructions('@fake/app', fs.basePath, application, true).execute()
    assert.isTrue(completed)

    const tsContents = await fs.fsExtra.readJSON(join(fs.basePath, 'tsconfig.json'))
    assert.deepEqual(tsContents, {
      compilerOptions: {
        types: ['@adonisjs/core'],
      },
    })
  })

  test('define providers inside .adonisrc.json file', async ({ assert }) => {
    await fs.add(
      'node_modules/@fake/app/package.json',
      JSON.stringify({
        name: '@fake/app',
        version: '1.0.0',
        adonisjs: {
          providers: ['@fake/app'],
        },
      })
    )

    const application = new Application(fs.basePath, 'web', {})
    const completed = await new Instructions('@fake/app', fs.basePath, application, true).execute()
    assert.isTrue(completed)

    const rcContents = await fs.fsExtra.readJSON(join(fs.basePath, '.adonisrc.json'))
    assert.deepEqual(rcContents, {
      providers: ['@fake/app'],
    })
  })

  test('define aliases inside .adonisrc.json and tsconfig.json file', async ({ assert }) => {
    await fs.add(
      'node_modules/@fake/app/package.json',
      JSON.stringify({
        name: '@fake/app',
        version: '1.0.0',
        adonisjs: {
          aliases: {
            App: './app',
          },
        },
      })
    )

    const application = new Application(fs.basePath, 'web', {})
    const completed = await new Instructions('@fake/app', fs.basePath, application, true).execute()
    assert.isTrue(completed)

    const rcContents = await fs.fsExtra.readJSON(join(fs.basePath, '.adonisrc.json'))
    const tsConfig = await fs.fsExtra.readJSON(join(fs.basePath, 'tsconfig.json'))

    assert.deepEqual(rcContents, {
      aliases: {
        App: './app',
      },
    })

    assert.deepEqual(tsConfig, {
      compilerOptions: {
        paths: {
          'App/*': ['./app/*'],
        },
      },
    })
  })

  test('define metaFiles inside .adonisrc.json', async ({ assert }) => {
    await fs.add(
      'node_modules/@fake/app/package.json',
      JSON.stringify({
        name: '@fake/app',
        version: '1.0.0',
        adonisjs: {
          metaFiles: ['resources/foo/*', { pattern: 'schemas/*', reloadServer: false }],
        },
      })
    )

    const application = new Application(fs.basePath, 'web', {})
    const completed = await new Instructions('@fake/app', fs.basePath, application, true).execute()
    assert.isTrue(completed)

    const rcContents = await fs.fsExtra.readJSON(join(fs.basePath, '.adonisrc.json'))

    assert.deepEqual(rcContents, {
      metaFiles: [
        'resources/foo/*',
        {
          pattern: 'schemas/*',
          reloadServer: false,
        },
      ],
    })
  })

  test('define preloads inside .adonisrc.json', async ({ assert }) => {
    await fs.add(
      'node_modules/@fake/app/package.json',
      JSON.stringify({
        name: '@fake/app',
        version: '1.0.0',
        adonisjs: {
          preloads: ['./start/kernel', { file: './start/repl', environment: ['web'] }],
        },
      })
    )

    const application = new Application(fs.basePath, 'web', {})
    const completed = await new Instructions('@fake/app', fs.basePath, application, true).execute()
    assert.isTrue(completed)

    const rcContents = await fs.fsExtra.readJSON(join(fs.basePath, '.adonisrc.json'))

    assert.deepEqual(rcContents, {
      preloads: [
        './start/kernel',
        {
          file: './start/repl',
          environment: ['web'],
        },
      ],
    })
  })
})
