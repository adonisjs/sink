/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { EnvFile } from '../src/Files/Special/Env'
import { Filesystem } from '@poppinss/dev-utils'
import { join } from 'path'

const fs = new Filesystem(join(__dirname, '__app'))

test.group('EnvFile', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  group.beforeEach(async () => {
    await fs.ensureRoot()
  })

  test('create .env and .env.example file', async (assert) => {
    const envFile = new EnvFile(fs.basePath)
    envFile.set('APP_KEY', 'foo-bar')
    envFile.commit()

    const contents = await fs.get('.env')
    const exampleFileContents = await fs.get('.env.example')
    assert.deepEqual(contents.trim(), 'APP_KEY=foo-bar')
    assert.deepEqual(exampleFileContents.trim(), 'APP_KEY=')
  })

  test('write subsitution variables inside .env file', async (assert) => {
    const envFile = new EnvFile(fs.basePath)
    envFile.set('URL', '$HOST:$PORT')
    envFile.set('PASSWORD', 'pa\\$\\$word')
    envFile.commit()

    const contents = await fs.get('.env')
    const exampleFileContents = await fs.get('.env.example')

    assert.deepEqual(contents.trim(), ['URL=$HOST:$PORT', 'PASSWORD=pa\\$\\$word'].join('\n'))
    assert.deepEqual(exampleFileContents.trim(), ['URL=', 'PASSWORD='].join('\n'))
  })

  test('update existing key value', async (assert) => {
    await fs.add('.env', 'APP_KEY=foo-bar')
    await fs.add('.env.example', 'APP_KEY=')

    const envFile = new EnvFile(fs.basePath)
    envFile.set('APP_KEY', 'bar')
    envFile.commit()

    const contents = await fs.get('.env')
    const exampleFileContents = await fs.get('.env.example')

    assert.deepEqual(contents.trim(), 'APP_KEY=bar')
    assert.deepEqual(exampleFileContents.trim(), 'APP_KEY=')
  })

  test('remove existing key', async (assert) => {
    await fs.add('.env', 'APP_KEY=foo-bar')
    await fs.add('.env.example', 'APP_KEY=')

    const envFile = new EnvFile(fs.basePath)
    envFile.unset('APP_KEY')
    envFile.commit()

    const contents = await fs.get('.env')
    const exampleFileContents = await fs.get('.env.example')

    assert.deepEqual(contents.trim(), '')
    assert.deepEqual(exampleFileContents.trim(), '')
  })

  test('remove line to rollback', async (assert) => {
    await fs.add('.env', 'APP_KEY=foo-bar')
    await fs.add('.env.example', 'APP_KEY=')

    const envFile = new EnvFile(fs.basePath)
    envFile.set('APP_KEY', 'foo-bar')
    envFile.rollback()

    const contents = await fs.get('.env')
    const exampleFileContents = await fs.get('.env.example')

    assert.deepEqual(contents.trim(), '')
    assert.deepEqual(exampleFileContents.trim(), '')
  })

  test('do not touch destructive commits on rollbacks', async (assert) => {
    await fs.add('.env', 'APP_KEY=foo')
    await fs.add('.env.example', 'APP_KEY=')

    const envFile = new EnvFile(fs.basePath)
    envFile.unset('APP_KEY')
    envFile.rollback()

    const contents = await fs.get('.env')
    const exampleFileContents = await fs.get('.env.example')

    assert.deepEqual(contents.trim(), 'APP_KEY=foo')
    assert.deepEqual(exampleFileContents.trim(), 'APP_KEY=')
  })

  test('get file contents', async (assert) => {
    await fs.add('.env', 'APP_KEY=foo')
    await fs.add('.env.example', 'APP_KEY=')

    const envFile = new EnvFile(fs.basePath)
    assert.deepEqual(envFile.get(), { APP_KEY: 'foo' })
  })
})
