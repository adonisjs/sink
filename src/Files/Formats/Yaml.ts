/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { yaml } from 'mrm-core'
import { KeyValuePair } from '../Base/KeyValuePair'

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
export class YamlFile extends KeyValuePair {
	public filePointer: ReturnType<typeof yaml>

	constructor(basePath: string, filename: string) {
		super(basePath)

		this.cdIn()
		this.filePointer = yaml(filename)
		this.cdOut()
	}
}
