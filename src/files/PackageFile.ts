/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { spawnSync, SpawnSyncReturns } from 'child_process'
import { packageJson, install, uninstall } from 'mrm-core'
import { BaseFile } from '../base/BaseFile'

type InstallerNotifier = (list: string[], dev: boolean) => void

/**
 * Exposes the API to work with `package.json` file. The file is
 * same as a standard JSON file, but with some special methods
 * related to package file itself.
 */
export class PackageFile extends BaseFile {
  public filePointer: ReturnType<typeof packageJson>

  protected $actions = []

  /**
   * A copy of install instructions
   */
  protected $install: { dependency: string, version: string, dev: boolean }[] = []

  /**
   * A copy of uninstall instructions
   */
  protected $uninstall: { dependency: string, dev: boolean }[] = []

  /**
   * Explicitly force to use yarn instead of npm
   */
  private _useYarn: boolean | null = null

  /**
   * Method invoked before installing dependencies
   */
  private _beforeInstall?: InstallerNotifier

  /**
   * Method invoked before uninstalling dependencies
   */
  private _beforeUnInstall?: InstallerNotifier

  constructor (
    basePath: string,
    private _installerOutput: 'pipe' | 'ignore' | 'inherit' = 'pipe',
  ) {
    super(basePath)
    this.$cdIn()
    this.filePointer = packageJson()
    this.$cdOut()
  }

  /**
   * Executes the install script
   */
  private _executeInstall (list: string[], options: Parameters<typeof install>[1] = {}) {
    if (!list.length) {
      return
    }

    if (this._useYarn !== null) {
      options.yarn = this._useYarn
    }

    if (typeof (this._beforeInstall) === 'function') {
      this._beforeInstall(list, options.dev!)
    }

    return install(list, options, (command: string, args: string[]) => {
      return spawnSync(command, args, {
        stdio: this._installerOutput,
      })
    }) as SpawnSyncReturns<Buffer>
  }

  /**
   * Execute uninstall script
   */
  private _executeUninstall (list: string[], options: Parameters<typeof uninstall>[1] = {}) {
    if (!list.length) {
      return
    }

    if (this._useYarn !== null) {
      options.yarn = this._useYarn
    }

    if (typeof (this._beforeUnInstall) === 'function') {
      this._beforeUnInstall(list, options.dev!)
    }

    return uninstall(list, options, (command: string, args: string[]) => {
      return spawnSync(command, args, {
        stdio: this._installerOutput,
      })
    }) as SpawnSyncReturns<Buffer>
  }

  /**
   * Install and uninstall packages defined in actions
   */
  private _install () {
    /**
     * Install development dependencies
     */
    const dev = this.getDependencies(true)
    let response = this._executeInstall(dev.list, { versions: dev.versions, dev: true })
    if (response && response.status === 1) {
      return response
    }

    /**
     * Install production dependencies
     */
    const prod = this.getDependencies(false)
    response = this._executeInstall(prod.list, { versions: prod.versions, dev: false })
    if (response && response.status === 1) {
      return response
    }

    /**
     * Uninstall production dependencies
     */
    const prodRemove = this.$uninstall.filter(({ dev }) => !dev).map(({ dependency }) => dependency)
    response = this._executeUninstall(prodRemove, { dev: false })
    if (response && response.status === 1) {
      return response
    }

    /**
     * Uninstall development dependencies
     */
    const devRemove = this.$uninstall.filter(({ dev }) => dev).map(({ dependency }) => dependency)
    response = this._executeUninstall(devRemove, { dev: true })
    if (response && response.status === 1) {
      return response
    }
  }

  /**
   * Performing uninstalling as a rollback step. Which means, this method
   * will remove packages marked for installation.
   */
  private _uninstall () {
    /**
     * Remove prod dependencies
     */
    const prod = this.getDependencies(false)
    this._executeUninstall(prod.list, { dev: false })

    /**
     * Remove dev dependencies
     */
    const dev = this.getDependencies(true)
    this._executeUninstall(dev.list, { dev: true })
  }

  /**
   * Set key/value pair in the package.json file
   */
  public set (key: string, value: any): this {
    this.$addAction('set', { key, value })
    return this
  }

  /**
   * Enable/disable use of yarn
   */
  public yarn (useYarn: boolean): this {
    this._useYarn = useYarn
    return this
  }

  /**
   * Unset key/value pair from the package.json file
   */
  public unset (key: string): this {
    this.$addAction('unset', { key })
    return this
  }

  /**
   * Set package.json script
   */
  public setScript (name: string, script: string): this {
    this.$addAction('setScript', { name, script })
    return this
  }

  /**
   * Append to existing package.json script
   */
  public appendScript (name: string, script: string) {
    this.$addAction('appendScript', { name, script })
    return this
  }

  /**
   * Prepend to existing package.json script
   */
  public prependScript (name: string, script: string) {
    this.$addAction('prependScript', { name, script })
    return this
  }

  /**
   * Remove existing script or remove a given action from an
   * existing script
   */
  public removeScript (name: string, script?: string | RegExp) {
    this.$addAction('removeScript', { name, script })
    return this
  }

  /**
   * Install dependencies
   */
  public install (
    dependency: string,
    version: string = 'latest',
    dev: boolean = true,
  ) {
    this.$install.push({ dependency, version, dev })
    return this
  }

  /**
   * Uninstall dependencies
   */
  public uninstall (dependency: string, dev: boolean = true) {
    this.$uninstall.push({ dependency, dev })
    return this
  }

  /**
   * Remove file
   */
  public delete () {
    this.$addAction('delete')
    return this
  }

  /**
   * Returns value for a given key from the file
   */
	public get (): any
	public get (address: string | string[], defaultValue?: any): any
  public get (address?: string | string[], defaultValue?: any): any {
    return address ? this.filePointer.get(address, defaultValue) : this.filePointer.get()
  }

  /**
   * A boolean telling if the file already exists
   */
  public exists () {
    return this.filePointer.exists()
  }

  /**
   * Returns a list of dependencies along with specific versions (if any)
   */
  public getDependencies (dev: boolean = true) {
    const dependencies: { list: string[], versions: any } = { versions: {}, list: [] }

    return this.$install.reduce((result, dependency) => {
      if (dependency.dev && dev) {
        result.list.push(dependency.dependency)
        if (dependency.version !== 'latest') {
          result.versions[dependency.dependency] = dependency.version
        }
      } else if (!dependency.dev && !dev) {
        result.list.push(dependency.dependency)
        if (dependency.version !== 'latest') {
          result.versions[dependency.dependency] = dependency.version
        }
      }

      return result
    }, dependencies)
  }

  /**
   * Define a function to be called before installing dependencies
   */
  public beforeInstall (callback: InstallerNotifier): this {
    this._beforeInstall = callback
    return this
  }

  /**
   * Define a function to be called before uninstalling dependencies
   */
  public beforeUnInstall (callback: InstallerNotifier): this {
    this._beforeUnInstall = callback
    return this
  }

  /**
   * Commit mutations
   */
  public commit () {
    this.$cdIn()
    const actions = this.$getCommitActions()
    const deleteFile = actions.find(({ action }) => action === 'delete')

    /**
     * In case of `delete` action. There is no point running
     * other actions and we can simply delete the file
     */
    if (deleteFile) {
      this.filePointer.delete()
      this.$cdOut()
      return
    }

    /**
     * Executing all actions
     */
    actions.forEach(({ action, body }) => {
      if (['set', 'unset'].indexOf(action) > -1) {
        this.filePointer[action](body.key, body.value)
        return
      }

      if (['prependScript', 'appendScript', 'setScript', 'removeScript'].indexOf(action) > -1) {
        this.filePointer[action](body.name, body.script)
        return
      }
    })

    /**
     * Save the file to the disk before starting install process.
     */
    this.filePointer.save()

    /**
     * Install/uninstall dependencies
     */
    const response = this._install()

    /**
     * cd out to process.cwd()
     */
    this.$cdOut()

    /**
     * Return response, which can be used to know if the commit passed
     * or failed.
     */
    return response
  }

  /**
   * Rollback mutations
   */
  public rollback () {
    this.$cdIn()
    const actions = this.$getCommitActions()

    /**
     * Executing actions in reverse.
     */
    actions.forEach(({ action, body }) => {
      if (action === 'set') {
        this.filePointer.unset(body.key)
        return
      }

      if (action === 'setScript') {
        this.filePointer.removeScript(body.name)
        return
      }

      if (['prependScript', 'appendScript'].indexOf(action) > -1) {
        this.filePointer.removeScript(body.name, new RegExp(body.script))
        return
      }
    })

    /**
     * Write file to the disk
     */
    this.filePointer.save()

    /**
     * Uninstalling installed packages
     */
    const response = this._uninstall()

    /**
     * Cd out to process.cwd()
     */
    this.$cdOut()

    /**
     * Return response, which can be used to know if the commit passed
     * or failed.
     */
    return response
  }
}
