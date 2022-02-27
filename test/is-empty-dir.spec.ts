/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { isEmptyDir } from '../src/Utils/isEmptyDir'
import { Filesystem } from '@poppinss/dev-utils'
import { join } from 'path'

const fs = new Filesystem(join(__dirname, '__app'))

test.group('isEmptyDir', (group) => {
  group.each.teardown(async () => {
    await fs.cleanup()
  })

  group.each.setup(async () => {
    await fs.ensureRoot()
  })

  test('return true when folder is empty', async ({ assert }) => {
    assert.isTrue(isEmptyDir(fs.basePath))
  })

  test('return false when folder is not empty', async ({ assert }) => {
    await fs.add('.DS_STORE', '')
    assert.isFalse(isEmptyDir(fs.basePath))
  })
})
