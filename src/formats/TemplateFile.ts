/*
* @adonisjs/boilerplate-utils
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { template } from 'mrm-core'
import { BaseFile } from '../base/BaseFile'

/**
 * Exposes the API to generate source files from template files.
 */
export class TemplateFile extends BaseFile {
  protected $actions = []
  public filePointer: ReturnType<typeof template>
  public removeOnRollback = true

  constructor (basePath: string, filename: string, templatePath: string) {
    super(basePath)

    this.$cdIn()
    this.filePointer = template(filename, templatePath)
    this.$cdOut()
  }

  /**
   * Returns existing contents for a template file
   */
  public get () {
    return this.filePointer.get()
  }

  /**
   * Apply contents to the template to evaluate it's output
   */
  public apply (contents?: any) {
    this.filePointer.apply(contents)
    return this
  }

  /**
   * Commit changes
   */
  public commit () {
    this.$cdIn()

    /**
     * Do not overwrite contents when file already exists, since
     * templates are supposed to grow of their own
     */
    if (this.filePointer.exists()) {
      this.$cdOut()
      return
    }

    this.filePointer.save()
    this.$cdOut()
  }

  /**
   * Rollback changes
   */
  public rollback () {
    this.$cdIn()

    /**
     * Remove the file on rollback (only when instructed) or this method results
     * is a noop
     */
    if (this.filePointer.exists() && this.removeOnRollback) {
      this.filePointer.delete()
    }

    this.$cdOut()
  }
}
