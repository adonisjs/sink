/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { JsonFile } from '../formats/JsonFile'

/**
 * Exposes API to mutate the contents of `.adonisrc.json` file.
 */
export class RcFile extends JsonFile {
  constructor (basePath: string) {
    super(basePath, '.adonisrc.json')
  }

  /**
   * Handle `preloads` in a custom way on rollback, since the `mrm-core` uses
   * `lodash.unset` which replaces the array index value with `null` and
   * we instead want to remove the index value completely.
   */
  public onset (lifecycle: string, body: any) {
    if (lifecycle === 'rollback') {
      if (body.key.startsWith('preloads')) {
        const index = body.key.split('[')[1].replace(/\]/g, '')
        this.get('preloads', []).splice(index, 1)
        return true
      }

      if (body.key.startsWith('copyToBuild')) {
        const index = body.key.split('[')[1].replace(/\]/g, '')
        this.get('copyToBuild', []).splice(index, 1)
        return true
      }
    }
  }

  /**
   * Set the exception handler namespace.
   */
  public setExceptionHandler (namespace: string): this {
    this.set('exceptionHandlerNamespace', namespace)
    return this
  }

  /**
   * Set the preload file to the `.adonisrc.json` file.
   */
  public setPreload (
    filePath: string,
    environment?: ('console' | 'test' | 'web')[],
    optional?: boolean,
  ): this {
    const preloads = this.get('preloads', [])
    let preloadIndex = preloads.findIndex((preload) => preload.file === filePath)
    preloadIndex = preloadIndex === -1 ? preloads.length : preloadIndex

    const preloadEntry: any = {
      file: filePath,
    }

    /**
     * Set the environment when it exists
     */
    if (environment) {
      preloadEntry.environment = environment
    }

    /**
     * Set the optional property when it exists
     */
    if (optional !== undefined) {
      preloadEntry.optional = optional
    }

    this.set(`preloads[${preloadIndex}]`, preloadEntry)
    return this
  }

  /**
   * Set custom autoload path
   */
  public setAutoload (namespace: string, autoloadPath: string): this {
    this.set(`autoloads.${namespace}`, autoloadPath)
    return this
  }

  /**
   * Set custom directory
   */
  public setDirectory (key: string, value: string): this {
    this.set(`directories.${key}`, value)
    return this
  }

  /**
   * Add custom file to `copyToBuild` array.
   */
  public addCopyToBuildFile (filePath: string) {
    const copyToBuild = this.get('copyToBuild', [])
    let entryIndex = copyToBuild.findIndex((file) => file === filePath)
    entryIndex = entryIndex === -1 ? copyToBuild.length : entryIndex

    this.set(`copyToBuild[${entryIndex}]`, filePath)
  }
}
