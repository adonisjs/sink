/*
* @adonisjs/boilerplate-utils
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { yaml } from 'mrm-core'
import { KeyValueFile } from '../base/KeyValueFile'

/**
 * Exposes the API to work with Yaml files.
 *
 * ```ts
 * const yaml = new YamlFile(__dirname, '.travis.yml')
 * yaml.set('language', 'node_js')
 * yaml.set('language', [4, 6])
 *
 * yaml.commit()
 * ```
 */
export class YamlFile extends KeyValueFile {
  public filePointer: ReturnType<typeof yaml>

  constructor (basePath: string, filename: string) {
    super(basePath)

    this.$cdIn()
    this.filePointer = yaml(filename)
    this.$cdOut()
  }
}
