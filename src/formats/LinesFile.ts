/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { lines } from 'mrm-core'
import { BaseFile } from '../base/BaseFile'

/**
 * Base class to work with raw text new line files. For example `.env`
 * file or `.gitignore`
 */
export class LinesFile extends BaseFile {
  public filePointer: ReturnType<typeof lines>
  protected $actions = []

  constructor (basePath: string, filename: string) {
    super(basePath)

    this.$cdIn()
    this.filePointer = lines(filename)
    this.$cdOut()
  }

  /**
   * Add one or more new lines
   */
  public add (lines: string | string[]): this {
    this.$addAction('add', { lines })
    return this
  }

  /**
   * Update existing text with new text
   */
  public update (oldText: string, newText: string): this {
    this.$addAction('update', { oldText, newText })
    return this
  }

  /**
   * Remove lines matching the give text
   */
  public remove (lines: string | string[]): this {
    this.$addAction('remove', { lines })
    return this
  }

  /**
   * Delete file
   */
  public delete () {
    this.$addAction('delete')
    return this
  }

  /**
   * Get contents for the file
   */
	public get (): string[] {
    return this.filePointer.get()
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

      if (action === 'add') {
        this.filePointer.add(body.lines)
        return
      }

      /**
       * on update we remove the old line and add the new one
       */
      if (action === 'update') {
        this.filePointer.remove(body.oldText)
        this.filePointer.add(body.newText)
        return
      }

      if (action === 'remove') {
        this.filePointer.remove(body.lines)
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

      if (action === 'add') {
        this.filePointer.remove(body.lines)
        return
      }

      if (action === 'update') {
        this.filePointer.remove(body.newText)
        this.filePointer.add(body.oldText)
        return
      }

      if (action === 'remove') {
        this.filePointer.add(body.lines)
      }
    })

    this.filePointer.save()
    this.$cdOut()
  }
}
