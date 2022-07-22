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
 * on the disk or by inspecting the "npm_execpath"
 */
export function getPackageManager(appRoot: string): 'yarn' | 'pnpm' | 'npm' {
  if (pathExistsSync(resolve(appRoot, 'yarn.lock'))) {
    return 'yarn'
  }

  if (pathExistsSync(resolve(appRoot, 'pnpm-lock.yaml'))) {
    return 'pnpm'
  }

  return process.env.npm_execpath && process.env.npm_execpath.includes('yarn')
    ? 'yarn'
    : process.env.npm_execpath && process.env.npm_execpath.includes('pnpm')
    ? 'pnpm'
    : 'npm'
}
