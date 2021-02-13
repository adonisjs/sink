/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ini } from 'mrm-core'
import { KeyValuePair } from '../Base/KeyValuePair'

/**
 * Ini file to work with files like `.editorconfig`.
 *
 * ```ts
 * const ini = new Ini(__dirname, '.editorconfig')
 * ini.set('_global', { root: true })
 * ini.set('**.js', { insert_final_newline: true })
 *
 * ini.commit()
 * ```
 */
export class IniFile extends KeyValuePair {
  public filePointer: ReturnType<typeof ini>

  constructor(basePath: string, filename: string) {
    super(basePath)

    /**
     * The `ini` function from `mrm-core` relies on the current
     * working directory, that's why we have to cd in to the
     * base path before creating a new instance of it.
     */
    this.cdIn()
    this.filePointer = ini(filename)
    this.cdOut()
  }

  /**
   * Handling the onmerge action. This method is called by
   * the `commit` method.
   */
  public onmerge(lifecycle: string, body: any) {
    if (lifecycle === 'commit') {
      this.filePointer.set(body.section, Object.assign({}, this.get(body.section), body.values))
      return true
    }

    if (lifecycle === 'rollback') {
      const resetObject = Object.keys(body.values).reduce((result, key) => {
        result[key] = undefined
        return result
      }, {})

      this.filePointer.set(body.section, Object.assign({}, this.get(body.section), resetObject))
      return true
    }
  }

  /**
   * Merge to the section values of an ini file.
   *
   * @example
   * ```ts
   * ini.merge('root', { indent_style: space })
   * ```
   */
  public merge(section: string, values: any): this {
    if (typeof values !== 'object' || values === null) {
      return this
    }

    this.addAction('merge', { section, values })
    return this
  }
}
