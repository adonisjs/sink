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
import { MarkdownRenderer } from '../src/Tasks/MarkdownRenderer'

const fs = new Filesystem(join(__dirname, '__app'))

test.group('Render markdown', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  group.beforeEach(async () => {
    await fs.ensureRoot()
  })

  /**
   * Skipping the tests in CI, since there is no way to automatically
   * test that everything is working fine without manual verification
   */
  test.skipInCI('render markdown file by opening it in the browser', async () => {
    await fs.add('foo.md', '## Hello world')
    await new MarkdownRenderer(join(fs.basePath, 'foo.md'), '@adonisjs/core').renderInBrowser()
  })

  test.skipInCI('render markdown file by rendering it inside terminal', async () => {
    await fs.add('foo.md', '## Hello world')
    await new MarkdownRenderer(join(fs.basePath, 'foo.md'), '@adonisjs/core').renderInTerminal()
  })
})
