/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import dot from 'dot'
import { file } from 'mrm-core'
import { readFileSync } from 'fs'
import { BaseFile } from '../base/BaseFile'

/**
 * Exposes the API to generate source files from template files.
 */
export class DotTemplate extends BaseFile {
  private templateData: any = {}
  private whitespace: boolean = true
  protected $actions = []

  public filePointer: ReturnType<typeof file>
  public removeOnRollback = true
  public overwrite = false

  constructor (basePath: string, filename: string, private templatePath: string) {
    super(basePath)

    this.$cdIn()
    this.filePointer = file(filename)
    this.$cdOut()
  }

  /**
   * Returns the contents of the template file
   */
  private readTemplate () {
    try {
      return readFileSync(this.templatePath, 'utf8')
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw Error(`Template file not found: ${this.templatePath}`)
      } else {
        throw err
      }
    }
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
    this.templateData = contents || {}
    return this
  }

  /**
   * Control whether or not to render whitespace. It is enabled by
   * default
   */
  public renderWhitespace (whitespaceFlag: boolean): this {
    this.whitespace = whitespaceFlag
    return this
  }

  /**
   * Commit changes
   */
  public commit () {
    this.$cdIn()

    /**
     * Do not overwrite contents when file already exists and
     * `overwrite = false`
     */
    if (this.filePointer.exists() && !this.overwrite) {
      this.$cdOut()
      return
    }

    try {
      const templateFn = dot.template(this.readTemplate(), Object.assign({}, dot.templateSettings, {
        strip: !this.whitespace,
      }))
      this.filePointer.save(templateFn(this.templateData))
      this.$cdOut()
    } catch (error) {
      this.$cdOut()
      throw error
    }
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
