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
export abstract class File {
	protected abstract actions: { action: string; body?: any }[] = []

	/**
	 * The user current working directory reference. This is maintained, since
	 * we virtually cd into the `basePath`.
	 */
	private currentDir: string
	constructor(private basePath: string) {}

	/**
	 * Add a new action to the actions stack. The action workings
	 * are independent on the user adding the action
	 */
	protected addAction(action: string, body?: any): void {
		this.actions.push({ action, body })
	}

	/**
	 * Returns an array of actions to commit
	 */
	protected getCommitActions() {
		return this.actions
	}

	/**
	 * Returns an array of actions for performing revert. Since
	 * reverts are done in reverse, this method will reverse
	 * the actions array.
	 */
	protected getRevertActions() {
		return this.actions.slice().reverse()
	}

	/**
	 * `cd` to the application base path
	 */
	protected cdIn() {
		this.currentDir = process.cwd()
		process.chdir(this.basePath)
	}

	/**
	 * `cd` out from the application base path
	 */
	protected cdOut() {
		process.chdir(this.currentDir)
	}
}
