/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { json } from 'mrm-core'
import { KeyValuePair } from '../Base/KeyValuePair'

/**
 * Exposes the API to work with JSON files.
 *
 * ```ts
 * const json = new JsonFile(__dirname, 'tsconfig.json')
 * json.set('compilerOptions.lib', ['es2017'])
 *
 * json.commit()
 * ```
 */
export class JsonFile extends KeyValuePair {
  public filePointer: ReturnType<typeof json>

  constructor (basePath: string, filename: string) {
    super(basePath)

    this.cdIn()
    this.filePointer = json(filename)
    this.cdOut()
  }
}
