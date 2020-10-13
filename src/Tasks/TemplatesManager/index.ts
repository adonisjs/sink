/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { logger } from '@poppinss/cliui'
import { extname, join, normalize, isAbsolute } from 'path'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'

import { TemplateNode } from '../../Contracts'
import { MustacheFile } from '../../Files/Formats/Mustache'
import { TemplateLiteralFile } from '../../Files/Formats/TemplateLiteral'

/**
 * Templates manager to copy one or more templates to the user project.
 */
export class TemplatesManager {
	constructor(
		private projectRoot: string,
		private templatesSourceDir: string,
		private application: ApplicationContract
	) {
		if (!isAbsolute(this.projectRoot)) {
			throw new Error('Templates manager needs an absolute path to the project root')
		}

		if (!isAbsolute(this.templatesSourceDir)) {
			throw new Error('Templates manager needs an absolute path to the templates source directory')
		}
	}

	/**
	 * Normalizes the template node to it's object version
	 */
	private normalizeTemplateNode(template: TemplateNode): Exclude<TemplateNode, string> {
		template =
			typeof template === 'string'
				? {
						src: template,
						dest: template.replace(new RegExp(`${extname(template)}$`), ''),
						mustache: false,
						data: {},
				  }
				: template

		template.dest = extname(template.dest) === '' ? `${template.dest}.ts` : template.dest
		return template
	}

	/**
	 * Returns directory for the template key. It is defined inside the adonisrc file.
	 */
	private getDirectoryFor(templateFor: string): string | undefined {
		/**
		 * Ensure the object key inside package.json file is a known directory
		 */
		const configuredDirectory = this.application.directoriesMap.get(templateFor)
		if (!configuredDirectory) {
			logger.warning(`Unknown directory type ${logger.colors.underline(templateFor)}`)
			return
		}

		return configuredDirectory
	}

	/**
	 * Copies template for a given given pre-defined directory within the rc file.
	 */
	private copyTemplateFor(templateFor: string, template: Exclude<TemplateNode, string>) {
		const configuredDirectory = this.getDirectoryFor(templateFor)
		if (!configuredDirectory) {
			return
		}

		if (!template.src || !template.dest) {
			throw new Error('src and dest are required when copying templates')
		}

		const sourcePath = join(this.templatesSourceDir, template.src)
		const destinationPath = normalize(`${configuredDirectory}/${template.dest}`)

		const renderer = template.mustache
			? new MustacheFile(this.projectRoot, destinationPath, sourcePath)
			: new TemplateLiteralFile(this.projectRoot, destinationPath, sourcePath)

		const hasFile = renderer.exists()
		renderer.apply(template.data)
		renderer.commit()

		if (hasFile) {
			logger.action('create').skipped(destinationPath)
		} else {
			logger.action('create').succeeded(destinationPath)
		}
	}

	/**
	 * Copy one or more templates for a given pre-defined directory within the rc file.
	 */
	private copyTemplatesFor(templateFor: string, templates: TemplateNode | TemplateNode[]) {
		templates = Array.isArray(templates) ? templates : [templates]
		templates
			.map((template) => this.normalizeTemplateNode(template))
			.forEach((template) => this.copyTemplateFor(templateFor, template))
	}

	/**
	 * Copy multiple templates to the destination. It takes the input of templates
	 * defined inside the package.json file.
	 */
	public async copy(templates: { [key: string]: TemplateNode | TemplateNode[] }) {
		Object.keys(templates).forEach((templateFor) => {
			if (templateFor === 'basePath') {
				return
			}
			this.copyTemplatesFor(templateFor, templates[templateFor])
		})
	}
}
