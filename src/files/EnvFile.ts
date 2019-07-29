/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { LinesFile } from '../formats/LinesFile'

/**
 * Exposes the API to run mutations on `.env` file. The same variables
 * will be added to `.env.example` with empty contents.
 */
export class EnvFile {
  private _envContents = new LinesFile(this._basePath, '.env')
  private _exampleEnvContents = new LinesFile(this._basePath, '.env.example')

  constructor (private _basePath: string) {
  }

  /**
   * Set key/value pair inside the `.env` file
   */
  public set (key: string, value: any): this {
    const matchingLine = this._envContents.get().find((line) => line.startsWith(`${key}=`))
    const newText = `${key}=${value}`

    if (matchingLine && newText !== matchingLine) {
      this._envContents.update(matchingLine, newText)
      return this
    }

    this._envContents.add(`${key}=${value}`)
    this._exampleEnvContents.add(`${key}=`)
    return this
  }

  /**
   * Unset a key/value pair from the `.env` and `.env.example` file
   */
  public unset (key: string): this {
    const matchingLine = this._envContents.get().find((line) => line.startsWith(`${key}=`))
    if (matchingLine) {
      this._envContents.remove(matchingLine)
    }

    const exampleFileMatchingLine = this._exampleEnvContents.get().find((line) => {
      return line.startsWith(`${key}=`)
    })
    if (exampleFileMatchingLine) {
      this._exampleEnvContents.remove(exampleFileMatchingLine)
    }

    return this
  }

  /**
   * Commit mutations
   */
  public commit () {
    this._envContents.commit()
    this._exampleEnvContents.commit()
  }

  /**
   * Rollback mutations
   */
  public rollback () {
    this._envContents.rollback()
    this._exampleEnvContents.rollback()
  }
}
