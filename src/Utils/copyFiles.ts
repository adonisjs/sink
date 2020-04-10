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

import { logger } from '../logger'

export function copyFiles (
  sourceBaseDir: string,
  destinationBaseDir: string,
  files: string[],
  options?: { overwrite: boolean },
) {
  const overwrite = options ? options.overwrite : false

  files.forEach((file) => {
    const absPath = join(sourceBaseDir, file)
    if (!existsSync(absPath)) {
      throw new Error(`Missing source file ${absPath}`)
    }

    const targetAbsPath = join(destinationBaseDir, file)
    const hasTarget = existsSync(targetAbsPath)
    if (hasTarget && !overwrite) {
      logger.skip(file)
      return
    }

    copyFile.sync(absPath, targetAbsPath, { overwrite: true })
    logger.create(file)
  })
}
