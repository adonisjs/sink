/*
* @adonisjs/sink
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

export type TemplateNode = {
  src: string,
  dest: string,
  data?: any,
  mustache?: boolean,
} | string

export type PackageInstructionsBlock = {
  instructions?: string,
  instructionsMd?: string,
  templates?: {
    basePath?: string,
  } & {
    [templateFor: string]: TemplateNode | TemplateNode[],
  },
  env?: {
    [key: string]: string,
  },
  types?: string,
  commands?: string[],
  providers?: string[],
  aceProviders?: string[],
}

export type PackageFile = PackageJson & {
  adonisjs: PackageInstructionsBlock
}
