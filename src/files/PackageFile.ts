/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { packageJson, install, uninstall } from 'mrm-core'
import { BaseFile } from '../base/BaseFile'

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

  private _useYarn: boolean | null = null

  constructor (basePath: string) {
    super(basePath)
    this.$cdIn()
    this.filePointer = packageJson()
    this.$cdOut()
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
   * Executes the install script
   */
  private _executeInstall (list: string[], options: Parameters<typeof install>[1] = {}) {
    if (!list.length) {
      return
    }

    if (this._useYarn !== null) {
      options.yarn = this._useYarn
    }

    install(list, options)
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

    uninstall(list, options)
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
     * Save the file to the disk
     */
    this.filePointer.save()

    /**
     * Install development dependencies
     */
    const dev = this.getDependencies(true)
    this._executeInstall(dev.list, { versions: dev.versions, dev: true })

    /**
     * Install production dependencies
     */
    const prod = this.getDependencies(false)
    this._executeInstall(prod.list, { versions: prod.versions, dev: false })

    /**
     * Uninstall production dependencies
     */
    const prodRemove = this.$uninstall.filter(({ dev }) => !dev).map(({ dependency }) => dependency)
    this._executeUninstall(prodRemove, { dev: false })

    /**
     * Uninstall development dependencies
     */
    const devRemove = this.$uninstall.filter(({ dev }) => dev).map(({ dependency }) => dependency)
    this._executeUninstall(devRemove, { dev: true })

    this.$cdOut()
  }

  /**
   * Rollback mutations
   */
  public rollback () {
    this.$cdIn()
    const actions = this.$getCommitActions()

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
     * Remove prod dependencies
     */
    const prod = this.getDependencies(false)
    this._executeUninstall(prod.list, { dev: false })

    /**
     * Remove dev dependencies
     */
    const dev = this.getDependencies(true)
    this._executeUninstall(dev.list, { dev: true })

    this.$cdOut()
  }
}
