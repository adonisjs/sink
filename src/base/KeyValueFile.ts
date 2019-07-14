/*
* @adonisjs/boilerplate-utils
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { json, yaml, ini } from 'mrm-core'
import { BaseFile } from './BaseFile'

/**
 * Exposes the API to work with key/value pair files like `ini`, `yaml`
 * and `json`.
 */
export abstract class KeyValueFile extends BaseFile {
  protected $actions = []
  public abstract filePointer: ReturnType<typeof json> | ReturnType<typeof yaml> | ReturnType<typeof ini>

  constructor (basePath: string) {
    super(basePath)
  }

  /**
   * Set key/value pair
   */
  public set (key: string, value: any): this {
    this.$addAction('set', { key, value })
    return this
  }

  /**
   * Unset key/value pair
   */
  public unset (key: string): this {
    this.$addAction('unset', { key })
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
      if (typeof (this[`on${action}`]) === 'function') {
        const handled = this[`on${action}`]('commit', body)
        /**
         * Return early when action is handled by the hook
         */
        if (handled) {
          return
        }
      }

      if (action === 'set') {
        this.filePointer.set(body.key, body.value)
        return
      }

      if (action === 'unset') {
        this.filePointer.unset(body.key)
      }
    })

    this.filePointer.save()
    this.$cdOut()
  }

  /**
   * Rollback mutations
   */
  public rollback () {
    this.$cdIn()
    const actions = this.$getRevertActions()

    actions.forEach(({ action, body }) => {
      if (typeof (this[`on${action}`]) === 'function') {
        const handled = this[`on${action}`]('rollback', body)

        /**
         * Return early when action is handled by the hook
         */
        if (handled) {
          return
        }
      }

      if (action === 'set') {
        this.filePointer.unset(body.key)
        return
      }
    })

    this.filePointer.save()
    this.$cdOut()
  }
}
