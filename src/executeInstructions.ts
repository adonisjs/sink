/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { esmRequire, resolveFrom } from '@poppinss/utils'
import { normalize, join, dirname } from 'path'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'

import { logger } from './logger'

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
  const sink = await import('../index')
  const packagePath = resolveFrom(projectRoot, `${packageName}/package.json`)
  const pkg = require(packagePath)

  /**
   * Return early when there is no `adonisjs` block in package.json file
   */
  if (!pkg.adonisjs) {
    return true
  }

  logger.pauseLogger()

  /**
   * Execute instructions when they exists in the package.json file
   */
  if (pkg.adonisjs.instructions) {
    const normalizedPath = normalize(`${packageName}/${pkg.adonisjs.instructions}`)
    const instructionsPath = resolveFrom(projectRoot, normalizedPath)

    /**
     * Requiring and executing instructions file
     */
    const instructions = esmRequire(instructionsPath)
    await instructions(projectRoot, application, sink)
  }

  /**
   * Copy templates when defined in package.json file
   */
  if (pkg.adonisjs.templates) {
    const templatesRoot = join(dirname(packagePath), pkg.adonisjs.templates.basePath || './build/templates')
    sink.copyTemplates(projectRoot, application, templatesRoot, pkg.adonisjs.templates)
  }

  /**
   * Set env variables when defined in package.json file
   */
  if (pkg.adonisjs.env) {
    const env = new sink.EnvFile(projectRoot)
    Object.keys(pkg.adonisjs.env).forEach((key) => env.set(key, pkg.adonisjs.env[key]))
    env.commit()
    logger.update('.env')
  }

  /**
   * Add package types to `tsconfig.json` file when they are defined
   */
  if (pkg.adonisjs.types) {
    const tsConfig = new sink.JsonFile(projectRoot, 'tsconfig.json')
    const types = tsConfig.get('compilerOptions.types') || []

    if (!types.find((type: string) => type.includes(pkg.adonisjs.types))) {
      types.push(pkg.adonisjs.types)
      tsConfig.set('compilerOptions.types', types)
      tsConfig.commit()
      logger.update('tsconfig.json')
    }
  }

  /**
   * Add commands to `.adonisrc.json` file
   */
  if (Array.isArray(pkg.adonisjs.commands)) {
    const adonisRcFile = new sink.RcFile(projectRoot)
    pkg.adonisjs.commands.forEach((command) => {
      adonisRcFile.addCommand(command)
    })

    adonisRcFile.commit()
    logger.update('.adonisrc.json')
  }

  /**
   * Add providers to `.adonisrc.json` file
   */
  if (Array.isArray(pkg.adonisjs.providers)) {
    const adonisRcFile = new sink.RcFile(projectRoot)
    pkg.adonisjs.providers.forEach((provider) => {
      adonisRcFile.addProvider(provider)
    })

    adonisRcFile.commit()
    logger.update('.adonisrc.json')
  }

  /**
   * Add ace providers to `.adonisrc.json` file
   */
  if (Array.isArray(pkg.adonisjs.aceProviders)) {
    const adonisRcFile = new sink.RcFile(projectRoot)
    pkg.adonisjs.aceProviders.forEach((provider) => {
      adonisRcFile.addAceProvider(provider)
    })

    adonisRcFile.commit()
    logger.update('.adonisrc.json')
  }

  /**
   * Render markdown file when `instructionsMd` property is defined in
   * package.json file
   */
  if (pkg.adonisjs.instructionsMd) {
    await sink.renderMarkdown(join(dirname(packagePath), pkg.adonisjs.instructionsMd), packageName)
  }

  /**
   * Filtering duplicate messages before logging them
   */
  const processedMessages: Set<string | Error> = new Set()
  logger.resumeLogger((message) => {
    if (processedMessages.has(message.message)) {
      return false
    }
    processedMessages.add(message.message)
    return true
  })

  return true
}
