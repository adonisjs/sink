/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

/**
 * Base file exposes the API to add action and `cd` in/out from
 * the application base directory.
 */
export abstract class BaseFile {
  protected abstract $actions: { action: string, body?: any }[] = []

  private _currentDir: string
  constructor (private _basePath: string) {
  }

  /**
   * Add a new action to the actions stack. The action workings
   * are independent on the user adding the action
   */
  protected $addAction (action: string, body?: any): void {
    this.$actions.push({ action, body })
  }

  /**
   * Returns an array of actions to commit
   */
  protected $getCommitActions () {
    return this.$actions
  }

  /**
   * Returns an array of actions for performing revert. Since
   * reverts are done in reverse, this method will reverse
   * the actions array.
   */
  protected $getRevertActions () {
    return this.$actions.slice().reverse()
  }

  /**
   * `cd` to the application base path
   */
  protected $cdIn () {
    this._currentDir = process.cwd()
    process.chdir(this._basePath)
  }

  /**
   * `cd` out from the application base path
   */
  protected $cdOut () {
    process.chdir(this._currentDir)
  }
}
