/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { underline } from 'kleur'
import fancyLogs from '@poppinss/fancy-logs'
import { extname, join, normalize } from 'path'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'

import { TemplateFile } from './formats/TemplateFile'

type TemplateNode = { src: string, dest: string } | string

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
      fancyLogs.error({ message: `Unknown directory type ${underline(templateFor)}`, icon: false })
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
      let dest = typeof (templateToCopy) === 'string' ? templateToCopy : templateToCopy.dest

      if (!src || !dest) {
        throw new Error('src and dest are required when copying templates')
      }

      const sourcePath = join(templatesBasePath, src)

      /**
       * Normalizing destination extension
       */
      dest = dest.replace(new RegExp(`${extname(dest)}$`), '.ts')
      const destinationPath = normalize(`${configuredDirectory}/${dest}`)
      const template = new TemplateFile(projectRoot, destinationPath, sourcePath)

      /**
       * Skip when file already exists
       */
      if (template.exists()) {
        fancyLogs.info({ message: `skip ${destinationPath}`, icon: false })
        return
      }

      template.apply({}).commit()
      fancyLogs.create({ message: destinationPath, icon: false })
    })
  })
}
