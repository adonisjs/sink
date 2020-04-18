/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import test from 'japa'
import endent from 'endent'
import { join } from 'path'
import { Filesystem } from '@adonisjs/dev-utils'
import { MustacheFile } from '../src/Files/Formats/Mustache'

const fs = new Filesystem(join(__dirname, '__app'))

test.group('Mustache File', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  group.beforeEach(async () => {
    await fs.ensureRoot()
  })

  test('create template file', async (assert) => {
    await fs.add('template.txt', 'hello world')

    const file = new MustacheFile(fs.basePath, 'foo.txt', join(fs.basePath, 'template.txt'))
    file.apply().commit()

    const contents = await fs.get('foo.txt')
    assert.equal(contents.trim(), 'hello world')
  })

  test('subsitute data', async (assert) => {
    await fs.add('template.txt', 'hello {{ name }}')

    const file = new MustacheFile(fs.basePath, 'foo.txt', join(fs.basePath, 'template.txt'))
    file.apply({ name: 'virk' }).commit()

    const contents = await fs.get('foo.txt')
    assert.equal(contents.trim(), 'hello virk')
  })

  test('write conditionals', async (assert) => {
    await fs.add('template.txt', `
    {{#username}}
      Hello {{ username }}
    {{/username}}
    {{^username}}
      Hello guest
    {{/username}}`)

    const file = new MustacheFile(fs.basePath, 'foo.txt', join(fs.basePath, 'template.txt'))
    file.apply({ username: 'virk' }).commit()

    const contents = await fs.get('foo.txt')
    assert.equal(contents.trim(), 'Hello virk')
  })

  test('do not modify template file when it already exists', async (assert) => {
    await fs.add('template.txt', 'hello world')
    await fs.add('foo.txt', 'hi world')

    const file = new MustacheFile(fs.basePath, 'foo.txt', join(fs.basePath, 'template.txt'))
    file.apply().commit()

    const contents = await fs.get('foo.txt')
    assert.equal(contents.trim(), 'hi world')
  })

  test('modify template file when overwrite is true', async (assert) => {
    await fs.add('template.txt', 'hello world')
    await fs.add('foo.txt', 'hi world')

    const file = new MustacheFile(fs.basePath, 'foo.txt', join(fs.basePath, 'template.txt'))
    file.overwrite = true
    file.apply().commit()

    const contents = await fs.get('foo.txt')
    assert.equal(contents.trim(), 'hello world')
  })

  test('remove file on rollback', async (assert) => {
    await fs.add('template.txt', 'hello world')
    await fs.add('foo.txt', 'hi world')

    const file = new MustacheFile(fs.basePath, 'foo.txt', join(fs.basePath, 'template.txt'))
    file.apply().rollback()

    const hasFile = await fs.fsExtra.pathExists(join(fs.basePath, 'foo.txt'))
    assert.isFalse(hasFile)
  })

  test('do not remove file on rollback when removeOnRollback=false', async (assert) => {
    await fs.add('template.txt', 'hello world')
    await fs.add('foo.txt', 'hi world')

    const file = new MustacheFile(fs.basePath, 'foo.txt', join(fs.basePath, 'template.txt'))
    file.removeOnRollback = false
    file.apply().rollback()

    const hasFile = await fs.fsExtra.pathExists(join(fs.basePath, 'foo.txt'))
    assert.isTrue(hasFile)
  })

  test('do not mess up whitespaces inside conditionals and loops', async (assert) => {
    await fs.add('template.txt', endent`
    {
      {{#lucid}}
      "driver": "lucid"
      {{/lucid}}
      {{#database}}
      "driver": "database"
      {{/database}}
    }
    `)

    const file = new MustacheFile(fs.basePath, 'foo.txt', join(fs.basePath, 'template.txt'))
    file.apply({ lucid: true }).commit()

    const contents = await fs.get('foo.txt')
    assert.equal(contents.trim(), endent`{
      "driver": "lucid"
    }`)
  })

  test('render partials', async (assert) => {
    await fs.add('template.txt', '{{ > user }}')
    await fs.add('user.txt', 'hello {{ name }}')

    const file = new MustacheFile(fs.basePath, 'foo.txt', join(fs.basePath, 'template.txt'))
    file.partials({
      user: join(fs.basePath, 'user.txt'),
    })
    file.apply({ name: 'virk' }).commit()

    const contents = await fs.get('foo.txt')
    assert.equal(contents.trim(), 'hello virk')
  })
})
