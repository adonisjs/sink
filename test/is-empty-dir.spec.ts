/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import * as test from 'japa'
import { isEmptyDir } from '../src/isEmptyDir'
import { Filesystem } from '@adonisjs/dev-utils'
import { join } from 'path'

const fs = new Filesystem(join(__dirname, '__app'))

test.group('isEmptyDir', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  group.beforeEach(async () => {
    await fs.ensureRoot()
  })

  test('return true when folder is empty', async (assert) => {
    assert.isTrue(isEmptyDir(fs.basePath))
  })

  test('return false when folder is not empty', async (assert) => {
    await fs.add('.DS_STORE', '')
    assert.isFalse(isEmptyDir(fs.basePath))
  })
})
