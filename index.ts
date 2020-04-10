/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { PromptContract } from '@poppinss/prompts'
import { Colors, FakeColors } from '@poppinss/colors'

import './src/disableLogger'
import * as pkg from './package.json'

/**
 * Returning an instance of colors based upon the env we are in. Since `colors` or
 * `fakeColors` doesn't have side-effects, we can re-use a single instance
 * accross the entire code base
 */
const kleur = process.env.NODE_ENV === 'testing' ? new FakeColors() : new Colors()

/**
 * Returns a new instance of prompt. Also we lazy load the prompts
 */
function getPrompt (): PromptContract {
  const { Prompt, FakePrompt } = require('@poppinss/prompts')
  return process.env.NODE_ENV === 'testing' ? new FakePrompt() : new Prompt()
}

/**
 * Sharing the sink version, since sink is mainly passed as a reference by
 * the cli
 */
export const sinkVersion = pkg.version

export { kleur }
export { getPrompt }
export { kleur as colors }

export { logger } from './src/logger'
export * as files from './src/Files'
export * as tasks from './src/Tasks'
export * as utils from './src/Utils'
