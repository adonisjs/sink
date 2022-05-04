/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'path'
import { test } from '@japa/runner'
import { Filesystem } from '@poppinss/dev-utils'
import { MarkdownRenderer } from '../src/Tasks/MarkdownRenderer'

const fs = new Filesystem(join(__dirname, '__app'))

test.group('Render markdown', (group) => {
  group.each.teardown(async () => {
    await fs.cleanup()
  })

  group.each.setup(async () => {
    await fs.ensureRoot()
  })

  /**
   * Skipping the tests in CI, since there is no way to automatically
   * test that everything is working fine without manual verification
   */
  test('render markdown file by opening it in the browser', async () => {
    await fs.add('foo.md', '## Hello world')
    await new MarkdownRenderer(join(fs.basePath, 'foo.md'), '@adonisjs/core').renderInBrowser()
  })

  test('render markdown file by rendering it inside terminal', async () => {
    await fs.add('foo.md', '## Hello world')
    await new MarkdownRenderer(join(fs.basePath, 'foo.md'), '@adonisjs/core').renderInTerminal()
  })
})
