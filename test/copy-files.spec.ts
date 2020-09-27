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

import { copyFiles } from '../src/Utils/copyFiles'
const fs = new Filesystem(join(__dirname, '__app'))

test.group('Copy files', (group) => {
	group.afterEach(async () => {
		await fs.cleanup()
	})

	test('copy files from source to destination', async (assert) => {
		await fs.add('foo.txt', 'hello world')
		await fs.add('bar.txt', 'hi world')

		copyFiles(fs.basePath, join(fs.basePath, 'project', 'foo'), ['foo.txt', 'bar.txt'])

		const fooContents = await fs.get('project/foo/foo.txt')
		const barContents = await fs.get('project/foo/bar.txt')
		assert.equal(fooContents, 'hello world')
		assert.equal(barContents, 'hi world')
	})

	test('do not overwrite file when file already exists', async (assert) => {
		await fs.add('foo.txt', 'hello world')
		await fs.add('bar.txt', 'hi world')
		await fs.add('project/foo/foo.txt', 'hey world')

		copyFiles(fs.basePath, join(fs.basePath, 'project', 'foo'), ['foo.txt', 'bar.txt'])

		const fooContents = await fs.get('project/foo/foo.txt')
		const barContents = await fs.get('project/foo/bar.txt')
		assert.equal(fooContents, 'hey world')
		assert.equal(barContents, 'hi world')
	})

	test('overwrite file when overwrite flag is set to true', async (assert) => {
		await fs.add('foo.txt', 'hello world')
		await fs.add('bar.txt', 'hi world')
		await fs.add('project/foo/foo.txt', 'hey world')

		copyFiles(fs.basePath, join(fs.basePath, 'project', 'foo'), ['foo.txt', 'bar.txt'], {
			overwrite: true,
		})

		const fooContents = await fs.get('project/foo/foo.txt')
		const barContents = await fs.get('project/foo/bar.txt')
		assert.equal(fooContents, 'hello world')
		assert.equal(barContents, 'hi world')
	})

	test('copy images', async (assert) => {
		copyFiles(__dirname, join(fs.basePath, 'project', 'foo'), ['unicorn.jpg'])

		const exists = await fs.fsExtra.pathExists(join(fs.basePath, 'project/foo/unicorn.jpg'))
		assert.isTrue(exists)
	})
})
