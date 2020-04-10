/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import test from 'japa'
import { join } from 'path'
import { Filesystem } from '@adonisjs/dev-utils'

import { AdonisRcFile } from '../src/Files/Special/AdonisRc'

const fs = new Filesystem(join(__dirname, '__app'))

test.group('AdonisRc file', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  group.beforeEach(async () => {
    await fs.ensureRoot()
  })

  test('create adonisrc file when missing', async (assert) => {
    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.set('name', 'foo-app')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), { name: 'foo-app' })
  })

  test('set exception handler', async (assert) => {
    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.setExceptionHandler('App/Exceptions/Handler')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), { exceptionHandlerNamespace: 'App/Exceptions/Handler' })
  })

  test('remove handler namespace on rollback', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      exceptionHandlerNamespace: 'App/Exceptions/Handler',
    }))

    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.setExceptionHandler('App/Exceptions/Handler')
    rcfile.rollback()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {})
  })

  test('set preloads', async (assert) => {
    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.setPreload('start/routes')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      preloads: ['start/routes'],
    })
  })

  test('set mulitple preloads', async (assert) => {
    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.setPreload('start/routes')
    rcfile.setPreload('start/kernel')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      preloads: ['start/routes', 'start/kernel'],
    })
  })

  test('append to preloads when already exists', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      preloads: [{
        file: 'start/kernel',
      }],
    }))

    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.setPreload('start/routes')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      preloads: [{ file: 'start/kernel' }, 'start/routes'],
    })
  })

  test('edit existing preload file when filePath are same', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      preloads: [{
        file: 'start/kernel',
        optional: true,
      }],
    }))

    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.setPreload('start/kernel')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      preloads: ['start/kernel'],
    })
  })

  test('edit existing preload by adding new properties', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      preloads: [{
        file: 'start/kernel',
      }],
    }))

    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.setPreload('start/kernel', ['web'], false)
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      preloads: [
        {
          file: 'start/kernel',
          environment: ['web'],
          optional: false,
        },
      ],
    })
  })

  test('remove preload on rollback', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      preloads: [
        {
          file: 'start/kernel',
        },
        {
          file: 'start/routes',
        },
      ],
    }, null, 2))

    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.setPreload('start/kernel', ['web'], false)
    rcfile.rollback()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      preloads: [
        {
          file: 'start/routes',
        },
      ],
    })
  })

  test('set autoload path', async (assert) => {
    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.setAlias('App', 'app')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      aliases: {
        App: 'app',
      },
    })
  })

  test('update existing autoload path', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      aliases: {
        App: './app',
      },
    }, null, 2))

    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.setAlias('App', 'app')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      aliases: {
        App: 'app',
      },
    })
  })

  test('remove existing autoload path on rollback', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      aliases: {
        App: './app',
      },
    }, null, 2))

    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.setAlias('App', 'app')
    rcfile.rollback()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      aliases: {},
    })
  })

  test('set custom directory', async (assert) => {
    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.setDirectory('config', 'config')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      directories: {
        'config': 'config',
      },
    })
  })

  test('update existing directory path', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      directories: {
        config: 'config',
      },
    }, null, 2))

    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.setDirectory('config', 'config')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      directories: {
        config: 'config',
      },
    })
  })

  test('remove existing directory path on rollback', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      directories: {
        config: 'config',
        database: 'database',
      },
    }, null, 2))

    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.setDirectory('config', 'config')
    rcfile.rollback()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      directories: {
        database: 'database',
      },
    })
  })

  test('add file to metaFiles array', async (assert) => {
    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.addMetaFile('.env')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      metaFiles: ['.env'],
    })
  })

  test('add multiple files to metaFiles array', async (assert) => {
    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.addMetaFile('.env')
    rcfile.addMetaFile('.gitignore')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      metaFiles: ['.env', '.gitignore'],
    })
  })

  test('update file inside metaFiles array', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      metaFiles: ['.env'],
    }, null, 2))

    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.addMetaFile('.env')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      metaFiles: ['.env'],
    })
  })

  test('update file inside metaFiles array by adding new file', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      metaFiles: ['.env'],
    }, null, 2))

    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.addMetaFile('.adonisrc.json')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      metaFiles: ['.env', '.adonisrc.json'],
    })
  })

  test('remove file from metaFiles array on rollback', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      metaFiles: ['.env', '.adonisrc.json'],
    }, null, 2))

    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.addMetaFile('.adonisrc.json')
    rcfile.rollback()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      metaFiles: ['.env'],
    })
  })

  test('add meta file with explicit reloadServer property', async (assert) => {
    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.addMetaFile('.adonisrc.json', false)
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      metaFiles: [{ pattern: '.adonisrc.json', reloadServer: false }],
    })
  })

  test('set reloadServer property to false', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      metaFiles: ['.adonisrc.json'],
    }, null, 2))

    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.addMetaFile('.adonisrc.json', false)
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      metaFiles: [{ pattern: '.adonisrc.json', reloadServer: false }],
    })
  })

  test('set reloadServer property to true', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      metaFiles: [{ pattern: '.adonisrc.json', reloadServer: false }],
    }, null, 2))

    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.addMetaFile('.adonisrc.json')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      metaFiles: ['.adonisrc.json'],
    })
  })

  test('add command apth to commands array', async (assert) => {
    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.addCommand('./commands/Foo')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      commands: ['./commands/Foo'],
    })
  })

  test('add multiple command paths to commands array', async (assert) => {
    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.addCommand('./commands/Foo')
    rcfile.addCommand('./commands/Bar')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      commands: ['./commands/Foo', './commands/Bar'],
    })
  })

  test('update command path inside commands array', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      commands: ['./commands/Foo'],
    }, null, 2))

    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.addCommand('./commands/Foo')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      commands: ['./commands/Foo'],
    })
  })

  test('update command path inside commands array by adding new command', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      commands: ['./commands/Foo'],
    }, null, 2))

    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.addCommand('./commands/Bar')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      commands: ['./commands/Foo', './commands/Bar'],
    })
  })

  test('remove commands path from commands array on rollback', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      commands: ['./commands/Foo'],
    }, null, 2))

    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.addCommand('./commands/Bar')
    rcfile.rollback()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      commands: ['./commands/Foo'],
    })
  })

  test('add provider to providers array', async (assert) => {
    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.addProvider('./providers/App')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      providers: ['./providers/App'],
    })
  })

  test('add multiple providers to providers array', async (assert) => {
    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.addProvider('@adonisjs/core')
    rcfile.addProvider('@adonisjs/fold')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      providers: ['@adonisjs/core', '@adonisjs/fold'],
    })
  })

  test('update provider path inside providers array', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      providers: ['@adonisjs/core', '@adonisjs/fold'],
    }, null, 2))

    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.addProvider('@adonisjs/core')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      providers: ['@adonisjs/core', '@adonisjs/fold'],
    })
  })

  test('update provider path inside providers array by adding new provider', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      providers: ['@adonisjs/core'],
    }, null, 2))

    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.addProvider('@adonisjs/fold')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      providers: ['@adonisjs/core', '@adonisjs/fold'],
    })
  })

  test('remove provider path from providers array on rollback', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      providers: ['@adonisjs/core'],
    }, null, 2))

    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.addProvider('@adonisjs/fold')
    rcfile.rollback()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      providers: ['@adonisjs/core'],
    })
  })

  test('add provider to ace providers array', async (assert) => {
    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.addAceProvider('./providers/App')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      aceProviders: ['./providers/App'],
    })
  })

  test('add multiple providers to ace providers array', async (assert) => {
    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.addAceProvider('@adonisjs/core')
    rcfile.addAceProvider('@adonisjs/fold')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      aceProviders: ['@adonisjs/core', '@adonisjs/fold'],
    })
  })

  test('update provider path inside ace providers array', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      aceProviders: ['@adonisjs/core', '@adonisjs/fold'],
    }, null, 2))

    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.addAceProvider('@adonisjs/core')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      aceProviders: ['@adonisjs/core', '@adonisjs/fold'],
    })
  })

  test('update provider path inside ace providers array by adding new provider', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      aceProviders: ['@adonisjs/core'],
    }, null, 2))

    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.addAceProvider('@adonisjs/fold')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      aceProviders: ['@adonisjs/core', '@adonisjs/fold'],
    })
  })

  test('remove provider path from ace providers array on rollback', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      aceProviders: ['@adonisjs/core'],
    }, null, 2))

    const rcfile = new AdonisRcFile(fs.basePath)
    rcfile.addAceProvider('@adonisjs/fold')
    rcfile.rollback()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      aceProviders: ['@adonisjs/core'],
    })
  })
})
