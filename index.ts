/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export {
  table,
  logger,
  sticker,
  instructions,
  isInteractive,
  supportsColors,
  testingRenderer,
  tasks as tasksUi,
} from '@poppinss/cliui'
import { PromptContract } from '@poppinss/prompts'

import './src/disableLogger'
import * as pkg from './package.json'

/**
 * Returns a new instance of prompt. Also we lazy load the prompts
 */
function getPrompt(): PromptContract {
  const { Prompt, FakePrompt } = require('@poppinss/prompts')
  return process.env.CLI_UI_IS_TESTING ? new FakePrompt() : new Prompt()
}

/**
 * Sharing the sink version, since sink is mainly passed as a reference by
 * the cli
 */
export const sinkVersion = pkg.version

export { getPrompt }

export * as files from './src/Files'
export * as tasks from './src/Tasks'
export * as utils from './src/Utils'
