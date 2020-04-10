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

import { NewLineFile } from '../src/Files/Formats/NewLine'

const fs = new Filesystem(join(__dirname, '__app'))

test.group('Lines file', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  group.beforeEach(async () => {
    await fs.ensureRoot()
  })

  test('create text file', async (assert) => {
    const file = new NewLineFile(fs.basePath, 'foo.txt')
    file.add('hello-world')
    file.commit()

    const contents = await fs.get('foo.txt')
    assert.equal(contents.trim(), 'hello-world')
  })

  test('append lines to text file', async (assert) => {
    await fs.add('foo.txt', 'hello-world')
    const file = new NewLineFile(fs.basePath, 'foo.txt')
    file.add('hi-world')
    file.commit()

    const contents = await fs.get('foo.txt')
    assert.equal(contents.trim(), 'hello-world\nhi-world')
  })

  test('do not append lines with same text', async (assert) => {
    await fs.add('foo.txt', 'hello-world')
    const file = new NewLineFile(fs.basePath, 'foo.txt')
    file.add('hello-world')
    file.commit()

    const contents = await fs.get('foo.txt')
    assert.equal(contents.trim(), 'hello-world')
  })

  test('remove lines', async (assert) => {
    await fs.add('foo.txt', 'hello-world')
    const file = new NewLineFile(fs.basePath, 'foo.txt')
    file.remove('hello-world')
    file.commit()

    const contents = await fs.get('foo.txt')
    assert.equal(contents.trim(), '')
  })

  test('remove lines on rollback', async (assert) => {
    await fs.add('foo.txt', 'hello-world')
    const file = new NewLineFile(fs.basePath, 'foo.txt')
    file.add('hello-world')
    file.rollback()

    const contents = await fs.get('foo.txt')
    assert.equal(contents.trim(), '')
  })

  test('add lines on rollback', async (assert) => {
    await fs.add('foo.txt', '')
    const file = new NewLineFile(fs.basePath, 'foo.txt')
    file.remove('hello-world')
    file.rollback()

    const contents = await fs.get('foo.txt')
    assert.equal(contents.trim(), 'hello-world')
  })

  test('delete file', async (assert) => {
    await fs.add('foo.txt', '')
    const file = new NewLineFile(fs.basePath, 'foo.txt')
    file.delete()
    file.rollback()

    const hasFile = await fs.fsExtra.pathExists('foo.txt')
    assert.isFalse(hasFile)
  })
})
