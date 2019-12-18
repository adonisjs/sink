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
import { TemplateFile } from './formats/TemplateFile'

type TemplateNode = { src: string, dest: string } | string

const colors = new Colors()

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

    /**
     * Loop and copy each template to the source
     */
    templatesToCopy.forEach((templateToCopy) => {
      const src = typeof (templateToCopy) === 'string' ? templateToCopy : templateToCopy.src
      let dest = typeof (templateToCopy) === 'string'
        ? templateToCopy.replace(new RegExp(`${extname(templateToCopy)}$`), '.ts')
        : extname(templateToCopy.dest) === '' ? `${templateToCopy.dest}.ts` : templateToCopy.dest

      if (!src || !dest) {
        throw new Error('src and dest are required when copying templates')
      }

      const sourcePath = join(templatesBasePath, src)
      const destinationPath = normalize(`${configuredDirectory}/${dest}`)
      const template = new TemplateFile(projectRoot, destinationPath, sourcePath)

      /**
       * Skip when file already exists
       */
      if (template.exists()) {
        logger.skip(destinationPath)
        return
      }

      template.apply({}).commit()
      logger.create(destinationPath)
    })
  })
}
