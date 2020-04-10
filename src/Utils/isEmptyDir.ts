/*
* @adonisjs/sink
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { readdirSync } from 'fs'

/**
 * Returns a boolean telling if a directory is empty or
 * not.
 */
export function isEmptyDir (location: string): boolean {
  try {
    const files = readdirSync(location)
    return files.length === 0
  } catch (error) {
    return error.code === 'ENOENT'
  }
}
