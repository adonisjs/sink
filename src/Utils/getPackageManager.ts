/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { resolve } from 'path'
import { pathExistsSync } from 'fs-extra'

/**
 * Returns the package manager in use by checking for the lock files
 * on the disk or by inspecting the "npm_config_user_agent".
 *
 * Defaults to npm when unable to detect the package manager.
 */
export function getPackageManager(appRoot: string): 'yarn' | 'pnpm' | 'npm' {
  if (pathExistsSync(resolve(appRoot, 'yarn.lock'))) {
    return 'yarn'
  }

  if (pathExistsSync(resolve(appRoot, 'pnpm-lock.yaml'))) {
    return 'pnpm'
  }

  if (process.env.npm_config_user_agent) {
    if (process.env.npm_config_user_agent.includes('yarn')) {
      return 'yarn'
    }

    if (process.env.npm_config_user_agent.includes('pnpm')) {
      return 'pnpm'
    }
  }

  return 'npm'
}
