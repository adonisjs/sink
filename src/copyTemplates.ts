/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { extname, normalize } from 'path'
import { ApplicationContract } from '@poppinss/application'
import { kleur, TemplateFile } from '../exports'

/**
 * Copy multiple templates to the user project.
 */
export function copyTemplates (
  projectRoot: string,
  application: ApplicationContract,
  templates: { [key: string]: (string | string[]) },
) {
  let basePath: string = 'build/templates'

  Object.keys(templates).forEach((templateFor) => {
    /**
     * Pick basePath from the templates object
     */
    if (templateFor === 'basePath') {
      basePath = templates[templateFor] as string
      return
    }

    /**
     * Warn when template for unknown directory type is defined
     */
    if (!application.directoriesMap.has(templateFor)) {
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
      const destinationPath = sourceFile.replace(extname(sourceFile), '.ts')
      const sourcePath = normalize(`${basePath}/${sourceFile}`)

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
