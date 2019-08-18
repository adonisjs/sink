/*
* @adonisjs/sink
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import * as log from 'mrm-core/src/util/log'

/**
 * Overwriting mrm logger to have support for custom log messages
 */
function noop () {}
log.info = noop
log.removed = noop
log.added = noop
