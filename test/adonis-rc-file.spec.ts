/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import test from 'japa'
import { RcFile } from '../src/files/RcFile'
import { Filesystem } from '@adonisjs/dev-utils'
import { join } from 'path'

const fs = new Filesystem(join(__dirname, '__app'))

test.group('AdonisRc file', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  group.beforeEach(async () => {
    await fs.ensureRoot()
  })

  test('create adonisrc file when missing', async (assert) => {
    const rcfile = new RcFile(fs.basePath)
    rcfile.set('name', 'foo-app')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), { name: 'foo-app' })
  })

  test('set exception handler', async (assert) => {
    const rcfile = new RcFile(fs.basePath)
    rcfile.setExceptionHandler('App/Exceptions/Handler')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), { exceptionHandlerNamespace: 'App/Exceptions/Handler' })
  })

  test('remove handler namespace on rollback', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      exceptionHandlerNamespace: 'App/Exceptions/Handler',
    }))

    const rcfile = new RcFile(fs.basePath)
    rcfile.setExceptionHandler('App/Exceptions/Handler')
    rcfile.rollback()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {})
  })

  test('set preloads', async (assert) => {
    const rcfile = new RcFile(fs.basePath)
    rcfile.setPreload('start/routes')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      preloads: ['start/routes'],
    })
  })

  test('set mulitple preloads', async (assert) => {
    const rcfile = new RcFile(fs.basePath)
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

    const rcfile = new RcFile(fs.basePath)
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

    const rcfile = new RcFile(fs.basePath)
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

    const rcfile = new RcFile(fs.basePath)
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

    const rcfile = new RcFile(fs.basePath)
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
    const rcfile = new RcFile(fs.basePath)
    rcfile.setAutoload('App', 'app')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      autoloads: {
        App: 'app',
      },
    })
  })

  test('update existing autoload path', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      autoloads: {
        App: './app',
      },
    }, null, 2))

    const rcfile = new RcFile(fs.basePath)
    rcfile.setAutoload('App', 'app')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      autoloads: {
        App: 'app',
      },
    })
  })

  test('remove existing autoload path on rollback', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      autoloads: {
        App: './app',
      },
    }, null, 2))

    const rcfile = new RcFile(fs.basePath)
    rcfile.setAutoload('App', 'app')
    rcfile.rollback()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      autoloads: {},
    })
  })

  test('set custom directory', async (assert) => {
    const rcfile = new RcFile(fs.basePath)
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

    const rcfile = new RcFile(fs.basePath)
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

    const rcfile = new RcFile(fs.basePath)
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
    const rcfile = new RcFile(fs.basePath)
    rcfile.addMetaFile('.env')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      metaFiles: ['.env'],
    })
  })

  test('add multiple files to metaFiles array', async (assert) => {
    const rcfile = new RcFile(fs.basePath)
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

    const rcfile = new RcFile(fs.basePath)
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

    const rcfile = new RcFile(fs.basePath)
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

    const rcfile = new RcFile(fs.basePath)
    rcfile.addMetaFile('.adonisrc.json')
    rcfile.rollback()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      metaFiles: ['.env'],
    })
  })

  test('add meta file with explicit reloadServer property', async (assert) => {
    const rcfile = new RcFile(fs.basePath)
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

    const rcfile = new RcFile(fs.basePath)
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

    const rcfile = new RcFile(fs.basePath)
    rcfile.addMetaFile('.adonisrc.json')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      metaFiles: ['.adonisrc.json'],
    })
  })

  test('add command apth to commands array', async (assert) => {
    const rcfile = new RcFile(fs.basePath)
    rcfile.addCommand('./commands/Foo')
    rcfile.commit()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      commands: ['./commands/Foo'],
    })
  })

  test('add multiple command paths to commands array', async (assert) => {
    const rcfile = new RcFile(fs.basePath)
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

    const rcfile = new RcFile(fs.basePath)
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

    const rcfile = new RcFile(fs.basePath)
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

    const rcfile = new RcFile(fs.basePath)
    rcfile.addCommand('./commands/Bar')
    rcfile.rollback()

    const contents = await fs.get('.adonisrc.json')
    assert.deepEqual(JSON.parse(contents), {
      commands: ['./commands/Foo'],
    })
  })
})
