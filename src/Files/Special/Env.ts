/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { NewLineFile } from '../Formats/NewLine'

/**
 * Exposes the API to run mutations on `.env` file. The same variables
 * will be added to `.env.example` with empty contents.
 */
export class EnvFile {
	private envContents = new NewLineFile(this.basePath, '.env')
	private exampleEnvContents = new NewLineFile(this.basePath, '.env.example')

	constructor(private basePath: string) {}

	/**
	 * Set key/value pair inside the `.env` file
	 */
	public set(key: string, value: any): this {
		const matchingLine = this.envContents.get().find((line) => line.startsWith(`${key}=`))
		const newText = `${key}=${value}`

		if (matchingLine && newText !== matchingLine) {
			this.envContents.update(matchingLine, newText)
			return this
		}

		this.envContents.add(`${key}=${value}`)
		this.exampleEnvContents.add(`${key}=`)
		return this
	}

	/**
	 * Returns a key/value pair of the file contents.
	 */
	public get(): { [key: string]: string } {
		return this.envContents.get().reduce((result, line) => {
			const [key, value] = line.split('=')
			result[key.trim()] = value.trim()
			return result
		}, {})
	}

	/**
	 * Returns a boolean telling if the file exists.
	 */
	public exists(): boolean {
		return this.envContents.exists()
	}

	/**
	 * Unset a key/value pair from the `.env` and `.env.example` file
	 */
	public unset(key: string): this {
		const matchingLine = this.envContents.get().find((line) => line.startsWith(`${key}=`))
		if (matchingLine) {
			this.envContents.remove(matchingLine)
		}

		const exampleFileMatchingLine = this.exampleEnvContents.get().find((line) => {
			return line.startsWith(`${key}=`)
		})
		if (exampleFileMatchingLine) {
			this.exampleEnvContents.remove(exampleFileMatchingLine)
		}

		return this
	}

	/**
	 * Commit mutations
	 */
	public commit() {
		this.envContents.commit()
		this.exampleEnvContents.commit()
	}

	/**
	 * Rollback mutations
	 */
	public rollback() {
		this.envContents.rollback()
		this.exampleEnvContents.rollback()
	}
}
