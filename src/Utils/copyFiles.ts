/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'path'
import copyFile from 'cp-file'
import { existsSync } from 'fs'

/**
 * Utility method to copy files
 */
export function copyFiles(
	sourceBaseDir: string,
	destinationBaseDir: string,
	files: string[],
	options?: { overwrite: boolean }
): { filePath: string; state: 'skipped' | 'copied' }[] {
	const overwrite = options ? options.overwrite : false

	return files.map((file) => {
		const absPath = join(sourceBaseDir, file)
		if (!existsSync(absPath)) {
			throw new Error(`Missing source file "${absPath}"`)
		}

		const targetAbsPath = join(destinationBaseDir, file)
		const hasTarget = existsSync(targetAbsPath)
		if (hasTarget && !overwrite) {
			return { filePath: file, state: 'skipped' }
		}

		copyFile.sync(absPath, targetAbsPath, { overwrite: true })
		return { filePath: file, state: 'copied' }
	})
}
