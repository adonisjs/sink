/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { template } from 'mrm-core'
import { File } from '../Base/File'

/**
 * Exposes the API to generate source files from template files.
 */
export class TemplateLiteralFile extends File {
  protected actions = []
  public filePointer: ReturnType<typeof template>
  public removeOnRollback = true
  public overwrite = false

  constructor (basePath: string, filename: string, templatePath: string) {
    super(basePath)

    this.cdIn()
    this.filePointer = template(filename, templatePath)
    this.cdOut()
  }

  /**
   * Returns existing contents for a template file
   */
  public get () {
    return this.filePointer.get()
  }

  /**
   * A boolean telling if the file already exists
   */
  public exists () {
    return this.filePointer.exists()
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
    this.cdIn()

    /**
     * Do not overwrite contents when file already exists and
     * `overwrite = false`
     */
    if (this.filePointer.exists() && !this.overwrite) {
      this.cdOut()
      return
    }

    this.filePointer.save()
    this.cdOut()
  }

  /**
   * Rollback changes
   */
  public rollback () {
    this.cdIn()

    /**
     * Remove the file on rollback (only when instructed) or this method results
     * is a noop
     */
    if (this.filePointer.exists() && this.removeOnRollback) {
      this.filePointer.delete()
    }

    this.cdOut()
  }
}
