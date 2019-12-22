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
import { renderMarkdown } from '../src/renderMarkdown'

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
  test.skipInCI('render markdown file by opening it on', async () => {
    await fs.add('foo.md', '## Hello world')
    await renderMarkdown(join(fs.basePath, 'foo.md'), '@adonisjs/core')
  })
})
