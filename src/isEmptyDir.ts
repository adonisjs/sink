/*
* @adonisjs/sink
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import * as emptyDir from 'empty-dir'

/**
 * Returns a boolean telling if a directory is empty or
 * not.
 */
export function isEmptyDir (
  location: string,
  filterFn?: (filePath: string) => boolean,
): boolean {
  try {
    return emptyDir.sync(location, filterFn)
  } catch (error) {
    return false
  }
}
