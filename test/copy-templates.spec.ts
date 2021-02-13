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
import { Filesystem } from '@poppinss/dev-utils'
import { Application } from '@adonisjs/application'
import { TemplatesManager } from '../src/Tasks/TemplatesManager'

const fs = new Filesystem(join(__dirname, '__app'))

test.group('Copy templates', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  group.beforeEach(async () => {
    await fs.ensureRoot()
  })

  test('copy templates to the destination path', async (assert) => {
    await fs.add(
      'templates/config/app.txt',
      `
      const foo = 'foo'
      export default foo`
    )

    const application = new Application(fs.basePath, 'web', {
      directories: new Map([['config', 'config']]),
    })

    new TemplatesManager(fs.basePath, join(fs.basePath, 'templates/config'), application).copy({
      config: ['app.txt'],
    })

    const contents = await fs.get('config/app.ts')
    assert.equal(
      contents,
      `
      const foo = 'foo'
      export default foo\n`
    )
  })

  test('ignore templates for unknown directories', async () => {
    await fs.add(
      'templates/config/app.txt',
      `
      const foo = 'foo'
      export default foo
    `
    )

    const application = new Application(fs.basePath, 'web', {
      directories: new Map([['config', 'config']]),
    })

    new TemplatesManager(fs.basePath, join(fs.basePath, 'templates/config'), application).copy({
      foo: ['app.txt'],
    })
  })

  test('do not overwrite contents when file already exists', async (assert) => {
    const application = new Application(fs.basePath, 'web', {
      directories: new Map([['config', 'config']]),
    })

    /**
     * Round 1
     */
    await fs.add(
      'templates/config/app.txt',
      `
      const foo = 'foo'
      export default foo`
    )

    new TemplatesManager(fs.basePath, join(fs.basePath, 'templates/config'), application).copy({
      config: ['app.txt'],
    })

    /**
     * Round 2
     */
    await fs.fsExtra.outputFile(
      join(fs.basePath, 'templates/config/app.txt'),
      `
      const bar = 'bar'
      export default bar`
    )

    new TemplatesManager(fs.basePath, join(fs.basePath, 'templates/config'), application).copy({
      config: ['app.txt'],
    })

    /**
     * Must be same as 1
     */
    const contents = await fs.get('config/app.ts')
    assert.equal(
      contents,
      `
      const foo = 'foo'
      export default foo\n`
    )
  })

  test('copy templates with custom destination path', async (assert) => {
    await fs.add(
      'templates/config/app.txt',
      `
      const foo = 'foo'
      export default foo`
    )

    const application = new Application(fs.basePath, 'web', {
      directories: new Map([['config', 'config']]),
    })

    new TemplatesManager(fs.basePath, join(fs.basePath, 'templates/config'), application).copy({
      config: [{ src: 'app.txt', dest: 'foo.ts' }],
    })

    const contents = await fs.get('config/foo.ts')
    assert.equal(
      contents,
      `
      const foo = 'foo'
      export default foo\n`
    )
  })

  test('define custom destination paths without extension', async (assert) => {
    await fs.add(
      'templates/config/app.txt',
      `
      const foo = 'foo'
      export default foo`
    )

    const application = new Application(fs.basePath, 'web', {
      directories: new Map([['config', 'config']]),
    })

    new TemplatesManager(fs.basePath, join(fs.basePath, 'templates/config'), application).copy({
      config: [{ src: 'app.txt', dest: 'foo' }],
    })

    const contents = await fs.get('config/foo.ts')
    assert.equal(
      contents,
      `
      const foo = 'foo'
      export default foo\n`
    )
  })

  test('copy templates use mustache templates', async (assert) => {
    await fs.add(
      'templates/config/app.txt',
      `
      const foo = {{{name}}}
      export default foo`
    )

    const application = new Application(fs.basePath, 'web', {
      directories: new Map([['config', 'config']]),
    })

    new TemplatesManager(fs.basePath, join(fs.basePath, 'templates/config'), application).copy({
      config: [{ src: 'app.txt', dest: 'foo.ts', mustache: true, data: { name: "'bar'" } }],
    })

    const contents = await fs.get('config/foo.ts')
    assert.equal(
      contents,
      `
      const foo = 'bar'
      export default foo\n`
    )
  })
})
