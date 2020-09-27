/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Shape of the template node
 */
export type TemplateNode =
	| {
			src: string
			dest: string
			data?: any
			mustache?: boolean
	  }
	| string

/**
 * Shape of the package instructions node
 */
export type PackageInstructionsBlock = {
	instructions?: string
	instructionsMd?: string
	templates?: {
		basePath?: string
	} & {
		[templateFor: string]: TemplateNode | TemplateNode[]
	}
	env?: {
		[key: string]: string
	}
	types?: string
	commands?: string[]
	providers?: string[]
	aceProviders?: string[]
}

/**
 * Shape of the package file along with the adonisjs
 * block
 */
export type PackageFile = PackageJson & {
	adonisjs: PackageInstructionsBlock
}
