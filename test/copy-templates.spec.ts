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
import { Ioc } from '@adonisjs/fold'
import { Filesystem } from '@adonisjs/dev-utils'
import { Application } from '@adonisjs/application/build/standalone'
import { copyTemplates } from '../src/copyTemplates'

const fs = new Filesystem(join(__dirname, '__app'))

test.group('Copy templates', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  group.beforeEach(async () => {
    await fs.ensureRoot()
  })

  test('copy templates to the destination path', async (assert) => {
    await fs.add('templates/config/app.txt', `
      const foo = 'foo'
      export default foo`)

    const application = new Application(fs.basePath, new Ioc(), {
      directories: new Map([['config', 'config']]),
    }, {})

    copyTemplates(fs.basePath, application, join(fs.basePath, 'templates/config'), {
      config: ['app.txt'],
    })

    const contents = await fs.get('config/app.ts')
    assert.equal(contents, `
      const foo = 'foo'
      export default foo\n`)
  })

  test('ignore templates for unknown directories', async () => {
    await fs.add('templates/config/app.txt', `
      const foo = 'foo'
      export default foo`)

      const application = new Application(fs.basePath, new Ioc(), {
        directories: new Map([['config', 'config']]),
      }, {})

    copyTemplates(fs.basePath, application, join(fs.basePath, 'templates/config'), {
      foo: ['app.txt'],
    })
  })

  test('do not overwrite contents when file already exists', async (assert) => {
    const application = new Application(fs.basePath, new Ioc(), {
      directories: new Map([['config', 'config']]),
    }, {})

    /**
     * Round 1
     */
    await fs.add('templates/config/app.txt', `
      const foo = 'foo'
      export default foo`)

    copyTemplates(fs.basePath, application, join(fs.basePath, 'templates/config'), {
      config: ['app.txt'],
    })

    /**
     * Round 2
     */
    await fs.fsExtra.outputFile(join(fs.basePath, 'templates/config/app.txt'), `
      const bar = 'bar'
      export default bar`)

    copyTemplates(fs.basePath, application, join(fs.basePath, 'templates/config'), {
      config: ['app.txt'],
    })

    /**
     * Must be same as 1
     */
    const contents = await fs.get('config/app.ts')
    assert.equal(contents, `
      const foo = 'foo'
      export default foo\n`)
  })

  test('copy templates with custom destination path', async (assert) => {
    await fs.add('templates/config/app.txt', `
      const foo = 'foo'
      export default foo`)

    const application = new Application(fs.basePath, new Ioc(), {
      directories: new Map([['config', 'config']]),
    }, {})

    copyTemplates(fs.basePath, application, join(fs.basePath, 'templates/config'), {
      config: [{ src: 'app.txt', dest: 'foo.app' }],
    })

    const contents = await fs.get('config/foo.ts')
    assert.equal(contents, `
      const foo = 'foo'
      export default foo\n`)
  })
})
