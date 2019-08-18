/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { normalize } from 'path'
import { ApplicationContract } from '@poppinss/application'
import { esmRequire } from '@poppinss/utils'
import * as sink from '../exports'

/**
 * Executes the instructions file of a given AdonisJs package. It will look for
 * `adonisjs.instructions` block inside the `package.json` file, otherwise
 * this method results in a noop.
 */
export async function executeInstructions (
  packageName: string,
  projectRoot: string,
  application: ApplicationContract,
): Promise<boolean> {
  const packagePath = require.resolve(`${packageName}/package.json`, { paths: [projectRoot] })
  const pkg = require(packagePath)

  /**
   * Return early when there is no `adonisjs` or `adonisjs.instructions`
   * field
   */
  if (!pkg.adonisjs || !pkg.adonisjs.instructions) {
    return true
  }

  /**
   * Normalizing path
   */
  const normalizedPath = normalize(`${packageName}/${pkg.adonisjs.instructions}`)

  /**
   * Resolving instructions path from the project root
   */
  const instructionsPath = require.resolve(normalizedPath, { paths: [projectRoot] })

  /**
   * Requiring instructions
   */
  const instructions = esmRequire(instructionsPath)

  /**
   * Executing instructions
   */
  await instructions(projectRoot, application, sink)
  return true
}
