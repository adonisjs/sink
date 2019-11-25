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
  /**
   * Storing a local copy of preloads for concatenating
   * new entries.
   */
  private _preloads: any[] = []

  /**
   * Storing a local copy of metaFiles for concatenating
   * new entries.
   */
  private _metaFiles: any[] = []

  /**
   * Storing a local copy of commands for concatenating
   * new entries.
   */
  private _commands: any[] = []

  constructor (basePath: string) {
    super(basePath, '.adonisrc.json')
    this._preloads = this.get('preloads', [])
    this._metaFiles = this.get('metaFiles', [])
    this._commands = this.get('commands', [])
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

      if (body.key.startsWith('metaFiles')) {
        const index = body.key.split('[')[1].replace(/\]/g, '')
        this.get('metaFiles', []).splice(index, 1)
        return true
      }

      if (body.key.startsWith('commands')) {
        const index = body.key.split('[')[1].replace(/\]/g, '')
        this.get('commands', []).splice(index, 1)
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
    let preloadIndex = this._preloads.findIndex((preload) => preload.file === filePath)
    preloadIndex = preloadIndex === -1 ? this._preloads.length : preloadIndex

    let preloadEntry: any = {
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

    /**
     * Set preload entry as string, when it doesn't have explicit environment
     * and optional fields.
     */
    if (preloadEntry.optional === undefined && preloadEntry.environment === undefined) {
      preloadEntry = preloadEntry.file
    }

    this._preloads[preloadIndex] = preloadEntry
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
   * Add custom file to `metaFiles` array.
   */
  public addMetaFile (filePath: string, reloadServer?: boolean) {
    let entryIndex = this._metaFiles.findIndex((file) => {
      if (file.pattern) {
        return file.pattern === filePath
      }
      return file === filePath
    })
    entryIndex = entryIndex === -1 ? this._metaFiles.length : entryIndex

    const entry = reloadServer === false ? {
      pattern: filePath,
      reloadServer: false,
    } : filePath

    this._metaFiles[entryIndex] = entry
    this.set(`metaFiles[${entryIndex}]`, entry)
  }

  /**
   * Add new commands to the commands array
   */
  public addCommand (commandPath: string) {
    let entryIndex = this._commands.findIndex((command) => {
      return command === commandPath
    })
    entryIndex = entryIndex === -1 ? this._commands.length : entryIndex

    this._commands[entryIndex] = commandPath
    this.set(`commands[${entryIndex}]`, commandPath)
  }
}
