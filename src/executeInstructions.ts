/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { normalize } from 'path'
import { cyan, red } from 'kleur'
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

  try {
    const instructionsPath = require.resolve(
      normalize(`${packageName}/${pkg.adonisjs.instructions}`),
      {
        paths: [projectRoot],
      },
    )
    const instructions = esmRequire(instructionsPath)
    await instructions(projectRoot, application, sink)
    return true
  } catch (error) {
    const stack = error.stack.split('\n').map((line, index) => {
      return index === 0 ? `  ${line}` : `${new Array(15).join(' ')}${line}`
    }).join('\n')

    console.log(red(`Unable to execute instructions for ${packageName}. Check following stack`))
    console.log(`Sink version:  ${cyan(sink.sinkVersion)}`)
    console.log(`Project root:  ${cyan(projectRoot)}`)
    console.log(`Error stack:${red(stack)}`)
    return false
  }
}
