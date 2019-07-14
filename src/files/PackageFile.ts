/*
* @adonisjs/boilerplate-utils
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
  protected $install: { list: string[], dev: boolean }[] = []

  /**
   * A copy of uninstall instructions
   */
  protected $uninstall: { list: string[], dev: boolean }[] = []

  constructor (basePath: string) {
    super(basePath)
    this.$cdIn()
    this.filePointer = packageJson()
    this.$cdOut()
  }

  /**
   * Set key/value pair in the package.json file
   */
  public set (key: string, value: string): this {
    this.$addAction('set', { key, value })
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
  public install (dependencies: string | string[], dev: boolean = true) {
    const list = Array.isArray(dependencies) ? dependencies : [dependencies]
    this.$install.push({ list, dev })
    return this
  }

  /**
   * Uninstall dependencies
   */
  public uninstall (dependencies: string | string[], dev: boolean = true) {
    const list = Array.isArray(dependencies) ? dependencies : [dependencies]
    this.$uninstall.push({ list, dev })
    return this
  }

  /**
   * Commit mutations
   */
  public commit () {
    this.$cdIn()
    const actions = this.$getCommitActions()

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
     * Install/Uninstall dependencies. Make sure we do this after saving the
     * file, otherwise the `filePointer.save` will override the dependencies
     * object
     */
    this.$install.forEach(({ list, dev }) => install(list, { dev: dev }))
    this.$uninstall.forEach(({ list, dev }) => uninstall(list, { dev: dev }))

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
     * Remove installed dependencies. Make sure we do this after saving the
     * file, otherwise the `filePointer.save` will override the dependencies
     * object
     */
    this.$install.forEach(({ list, dev }) => uninstall(list, { dev: dev }))

    this.$cdOut()
  }
}
