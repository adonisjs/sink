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
export { RcFile } from './src/files/RcFile'
export { isEmptyDir } from './src/isEmptyDir'
export { EnvFile } from './src/files/EnvFile'
export { BaseFile } from './src/base/BaseFile'
export { IniFile } from './src/formats/IniFile'
export { YamlFile } from './src/formats/YamlFile'
export { JsonFile } from './src/formats/JsonFile'
export { LinesFile } from './src/formats/LinesFile'
export { copyTemplates } from './src/copyTemplates'
export { PackageFile } from './src/files/PackageFile'
export { KeyValueFile } from './src/base/KeyValueFile'
export { TemplateFile } from './src/formats/TemplateFile'
export { copyFiles, deleteFiles, makeDirs } from 'mrm-core'
