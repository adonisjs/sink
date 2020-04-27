/*
* @adonisjs/sink
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { dirname, join } from 'path'
import { esmRequire, resolveFrom } from '@poppinss/utils'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'

import { logger } from '../../logger'
import * as sink from '../../../index'
import { TemplatesManager } from '../TemplatesManager'
import { PackageFile, PackageInstructionsBlock } from '../../Contracts'

/**
 * Exposes the API to execute the instructions of a package, defined inside
 * the `package.json` file.
 */
export class Instructions {
  /**
   * Path to the package package.json file
   */
  private packagePath: string = this.getPackagePath()
  private markdownDisplay: 'browser' | 'terminal' | undefined = undefined

  constructor (
    private packageName: string,
    private projectRoot: string,
    private application: ApplicationContract,
    private verbose = false,
  ) {}

  /**
   * Returns the absolute path to the package
   */
  private getPackagePath () {
    try {
      return resolveFrom(this.projectRoot, `${this.packageName}/package.json`)
    } catch (error) {
      if (['MODULE_NOT_FOUND', 'ENOENT'].includes(error.code)) {
        throw new Error(`Cannot invoke instructions. Missing package "${this.packageName}"`)
      }
      throw error
    }
  }

  /**
   * Load package json file from the package root directory
   */
  private loadPackageJsonFile (): PackageFile {
    return require(this.packagePath)
  }

  /**
   * Copies templates to the user project
   */
  private copyTemplates (instructions: PackageInstructionsBlock) {
    if (!instructions.templates) {
      return
    }

    const templatesSourceDir = instructions.templates.basePath || './build/templates'
    const templatesManager = new TemplatesManager(
      this.projectRoot,
      join(dirname(this.packagePath), templatesSourceDir),
      this.application,
    )
    templatesManager.copy(instructions.templates)
  }

  /**
   * Set environment variables
   */
  private setEnvVariables (instructions: PackageInstructionsBlock) {
    if (!instructions.env) {
      return
    }

    const envFile = new sink.files.EnvFile(this.projectRoot)
    Object.keys(instructions.env).forEach((envKey) => envFile.set(envKey, instructions.env![envKey]))
    envFile.commit()

    logger.update({ message: '.env' })
  }

  /**
   * Adds the types to the tsconfig.json file
   */
  private setTypes (instructions: PackageInstructionsBlock) {
    if (!instructions.types) {
      return
    }

    const fileName = 'tsconfig.json'
    const tsConfig = new sink.files.JsonFile(this.projectRoot, fileName)
    const existingTypes = tsConfig.get('compilerOptions.types') || []

    /**
     * Push type when doesn't exists already
     */
    if (!existingTypes.find((type: string) => type.includes(instructions.types!))) {
      existingTypes.push(instructions.types)
      tsConfig.set('compilerOptions.types', existingTypes)
      tsConfig.commit()
    }

    const suffix = this.verbose ? `{ types += ${instructions.types} }` : ''
    logger.update({ message: fileName, suffix })
  }

  /**
   * Set commands inside the adonisrc.json file
   */
  private setCommands (instructions: PackageInstructionsBlock) {
    if (!instructions.commands) {
      return
    }

    const adonisRcFile = new sink.files.AdonisRcFile(this.projectRoot)
    instructions.commands.forEach((command) => adonisRcFile.addCommand(command))
    adonisRcFile.commit()

    const suffix = this.verbose ? `{ commands += ${instructions.commands} }` : ''
    logger.update({ message: '.adonisrc.json', suffix })
  }

  /**
   * Sets providers or ace providers inside the `.adonisrc.json` file
   */
  private setProviders (instructions: PackageInstructionsBlock) {
    let suffix = ''

    /**
     * Return early when not providers are mentioned
     */
    if (!instructions.providers && !instructions.aceProviders) {
      return
    }

    const adonisRcFile = new sink.files.AdonisRcFile(this.projectRoot)
    if (instructions.providers) {
      instructions.providers.forEach((provider) => adonisRcFile.addProvider(provider))
      suffix += `{ providers += ${instructions.providers} } `
    }

    if (instructions.aceProviders) {
      instructions.aceProviders.forEach((provider) => adonisRcFile.addAceProvider(provider))
      suffix += `{ aceProviders += ${instructions.aceProviders} }`
    }

    adonisRcFile.commit()
    logger.update({ message: '.adonisrc.json', suffix: this.verbose ? suffix : '' })
  }

  /**
   * Executes the instructions fn exposed by the package inside package.json file.
   */
  private async runInstructions (instructions: PackageInstructionsBlock) {
    if (!instructions.instructions) {
      return
    }

    /**
     * Path to the instructions file is resolved from the package root.
     */
    const instructionsPath = resolveFrom(dirname(this.packagePath), instructions.instructions)

    /**
     * Requiring and executing instructions file
     */
    const instructionsFn = esmRequire(instructionsPath)
    await instructionsFn(this.projectRoot, this.application, sink)
  }

  /**
   * Renders the markdown file if defined inside the package.json file.
   */
  private async renderMarkdownFile (instructions: PackageInstructionsBlock) {
    if (!instructions.instructionsMd || !this.verbose) {
      return
    }

    if (!this.markdownDisplay) {
      logger.info('The package wants to display readable instructions for the setup')
      this.markdownDisplay = await sink.getPrompt().choice('Select where to display instructions', [
        {
          name: 'browser',
          message: 'In the browser',
        },
        {
          name: 'terminal',
          message: 'In the terminal',
        },
      ])
    }

    /**
     * Render markdown file when `instructionsMd` property is defined in
     * package.json file
     */
    const renderer = new sink.tasks.MarkdownRenderer(
      join(dirname(this.packagePath), instructions.instructionsMd),
      this.packageName,
    )

    if (this.markdownDisplay === 'browser') {
      renderer.renderInBrowser()
    } else {
      console.log('')
      renderer.renderInTerminal()
    }
  }

  /**
   * Preset markdown display for avoiding prompt
   */
  public setDisplay (display: 'browser' | 'terminal') {
    this.markdownDisplay = display
    return this
  }

  /**
   * Execute the instructions file
   */
  public async execute () {
    const pkg = this.loadPackageJsonFile()
    if (!pkg.adonisjs) {
      return true
    }

    this.copyTemplates(pkg.adonisjs)
    this.setEnvVariables(pkg.adonisjs)
    this.setTypes(pkg.adonisjs)
    this.setCommands(pkg.adonisjs)
    this.setProviders(pkg.adonisjs)
    await this.runInstructions(pkg.adonisjs)
    await this.renderMarkdownFile(pkg.adonisjs)
    return true
  }
}
