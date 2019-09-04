/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import kleur from 'kleur'
import { extname, join, normalize } from 'path'
import { ApplicationContract } from '@poppinss/application'

import { TemplateFile } from './formats/TemplateFile'

/**
 * Copy multiple templates to the user project.
 */
export function copyTemplates (
  projectRoot: string,
  application: ApplicationContract,
  templatesBasePath: string,
  templates: { [key: string]: (string | string[]) },
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
      console.log(kleur.yellow(`Unknown directory type ${kleur.underline(templateFor)}`))
      return
    }

    const templatesToCopy = Array.isArray(templates[templateFor])
      ? templates[templateFor] as string[]
      : [templates[templateFor]] as string[]

    /**
     * Loop and copy each template to the source
     */
    templatesToCopy.forEach((sourceFile) => {
      const sourcePath = join(templatesBasePath, sourceFile)

      const destinationFile = sourceFile.replace(extname(sourceFile), '.ts')
      const destinationPath = normalize(`${configuredDirectory}/${destinationFile}`)

      const template = new TemplateFile(projectRoot, destinationPath, sourcePath)

      /**
       * Skip when file already exists
       */
      if (template.exists()) {
        console.log(`  skip    ${kleur.yellow(destinationPath)}`)
        return
      }

      template.apply({}).commit()
      console.log(`  create  ${kleur.green(destinationPath)}`)
    })
  })
}
