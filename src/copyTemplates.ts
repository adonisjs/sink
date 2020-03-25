/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { Colors } from '@poppinss/colors'
import { extname, join, normalize } from 'path'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'

import { logger } from './logger'
import { DotTemplate } from './formats/DotTemplate'
import { TemplateFile } from './formats/TemplateFile'

type TemplateNode = {
  src: string,
  dest: string,
  dotSyntax?: boolean,
  data?: any,
} | string

const colors = new Colors()

/**
 * Normalizes the template node
 */
function normalizeTemplateNode (templateNode: TemplateNode) {
  templateNode = typeof (templateNode) === 'string' ? {
    src: templateNode,
    dest: templateNode.replace(new RegExp(`${extname(templateNode)}$`), ''),
    dotSyntax: false,
    data: {},
  } : templateNode

  templateNode.dest = extname(templateNode.dest) === '' ? `${templateNode.dest}.ts` : templateNode.dest
  return templateNode
}

/**
 * Copy multiple templates to the user project.
 */
export function copyTemplates (
  projectRoot: string,
  application: ApplicationContract,
  templatesBasePath: string,
  templates: { [key: string]: TemplateNode | TemplateNode[] },
) {
  Object.keys(templates).forEach((templateFor) => {
    /**
     * Ignore the `basePath` key used for resolving the basePath of
     * templates
     */
    if (templateFor === 'basePath') {
      return
    }

    /**
     * The directory configured inside `.adonisrc.json` file for the
     * given template type
     */
    const configuredDirectory = application.directoriesMap.get(templateFor)

    /**
     * Warn when template for unknown directory type is defined
     */
    if (!configuredDirectory) {
      logger.error({
        message: `Unknown directory type ${colors.underline(templateFor)}`,
        icon: true,
      })
      return
    }

    const templatesToCopy = Array.isArray(templates[templateFor])
      ? templates[templateFor] as TemplateNode[]
      : [templates[templateFor]] as TemplateNode[]

    templatesToCopy.map(normalizeTemplateNode).forEach(({ src, dest, dotSyntax, data }) => {
      if (!src || !dest) {
        throw new Error('src and dest are required when copying templates')
      }

      const sourcePath = join(templatesBasePath, src)
      const destinationPath = normalize(`${configuredDirectory}/${dest}`)

      const template = dotSyntax
        ? new DotTemplate(projectRoot, destinationPath, sourcePath)
        : new TemplateFile(projectRoot, destinationPath, sourcePath)

      /**
       * Skip when file already exists
       */
      if (template.exists()) {
        logger.skip(destinationPath)
        return
      }

      template.apply(data || {}).commit()
      logger.create(destinationPath)
    })
  })
}
