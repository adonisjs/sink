/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import mustache from 'mustache'
import { file } from 'mrm-core'
import { readFileSync } from 'fs'
import { File } from '../Base/File'

/**
 * Exposes the API to generate source files from template files.
 */
export class MustacheFile extends File {
	private partialsPaths: { [key: string]: string } = {}
	private templateData: any = {}
	protected actions = []

	public filePointer: ReturnType<typeof file>
	public removeOnRollback = true
	public overwrite = false

	constructor(basePath: string, filename: string, private templatePath: string) {
		super(basePath)

		this.cdIn()
		this.filePointer = file(filename)
		this.cdOut()
	}

	/**
	 * Returns a key-value pair of partial names and their contents
	 */
	private getPartials() {
		return Object.keys(this.partialsPaths).reduce((result, name) => {
			result[name] = this.readTemplate(this.partialsPaths[name])
			return result
		}, {})
	}

	/**
	 * Returns the contents of the template file
	 */
	private readTemplate(templatePath: string) {
		try {
			return readFileSync(templatePath, 'utf8')
		} catch (err) {
			if (err.code === 'ENOENT') {
				throw Error(`Template file not found: ${templatePath}`)
			} else {
				throw err
			}
		}
	}

	/**
	 * Returns existing contents for a template file
	 */
	public get() {
		return this.filePointer.get()
	}

	/**
	 * A boolean telling if the file already exists
	 */
	public exists() {
		return this.filePointer.exists()
	}

	/**
	 * Define one or more partials by defining key-value
	 * pair of partial name and path to the file.
	 */
	public partials(partials: { [key: string]: string }): this {
		this.partialsPaths = partials
		return this
	}

	/**
	 * Apply contents to the template to evaluate it's output
	 */
	public apply(contents?: any) {
		this.templateData = contents || {}
		return this
	}

	/**
	 * Commit changes
	 */
	public commit() {
		this.cdIn()

		/**
		 * Do not overwrite contents when file already exists and
		 * `overwrite = false`
		 */
		if (this.filePointer.exists() && !this.overwrite) {
			this.cdOut()
			return
		}

		try {
			this.filePointer.save(
				mustache.render(this.readTemplate(this.templatePath), this.templateData, this.getPartials())
			)
			this.cdOut()
		} catch (error) {
			this.cdOut()
			throw error
		}
	}

	/**
	 * Rollback changes
	 */
	public rollback() {
		this.cdIn()

		/**
		 * Remove the file on rollback (only when instructed) or this method results
		 * is a noop
		 */
		if (this.filePointer.exists() && this.removeOnRollback) {
			this.filePointer.delete()
		}

		this.cdOut()
	}
}
