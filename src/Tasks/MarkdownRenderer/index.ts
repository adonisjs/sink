/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import open from 'open'
import { join } from 'path'
import { tmpdir } from 'os'
import inclusion from 'inclusion'
import { readFile, outputFile } from 'fs-extra'

import { css } from './Styles'

/**
 * Markdown renderer for opening the instructions md file inside the
 * terminal or the browser.
 */
export class MarkdownRenderer {
  constructor(private mdFileAbsPath: string, private packageName: string) {}

  /**
   * Generates HTML with the markdown processed code
   */
  private generateHtml(contents: string) {
    return `<html>
      <head>
        <style type="text/css">${css}</style>
      </head>
      <body>
        <article class="markdown-body">
          <h1> Setup instructions for
            <a href="https://npmjs.org/package/${this.packageName}" target="_blank">${this.packageName}</a>
          </h1>
          ${contents}
        </article>
      </body>
    </html>`
  }

  /**
   * Opens the html contents by writing it to a temporary
   * file and opens up the file inside the browser.
   */
  private async openContentsInBrowser(html: string) {
    const filePath = join(tmpdir(), `adonis-${new Date().getTime()}.html`)
    await outputFile(filePath, html)
    await open(filePath, { wait: false })
  }

  /**
   * Converts markdown to HTML and opens it up inside the browser
   */
  public async renderInBrowser() {
    const { marked, Renderer } = await inclusion('marked')

    try {
      const contents = await readFile(this.mdFileAbsPath, 'utf-8')
      const html = this.generateHtml(
        marked.setOptions({ renderer: new Renderer() })(contents.trim())
      )
      await this.openContentsInBrowser(html)
    } catch (error) {}
  }

  /**
   * Writes markdown in the terminal
   */
  public async renderInTerminal() {
    const { marked } = await inclusion('marked')
    const { TerminalRenderer } = await inclusion('marked-terminal')
    try {
      const contents = await readFile(this.mdFileAbsPath, 'utf-8')
      console.log(marked.setOptions({ renderer: new TerminalRenderer() })(contents.trim()).trim())
    } catch (error) {}
  }
}
