/*
 * @adonisjs/sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { spawnSync, SpawnSyncReturns, StdioOptions, spawn } from 'child_process'
import { packageJson, install, uninstall } from 'mrm-core'
import { File } from '../Base/File'

type InstallerFns = 'install' | 'uninstall'
type InstallerNotifier = (list: string[], dev: boolean) => void
type Dependencies = { list: string[], versions?: any, dev: boolean }

/**
 * Exposes the API to work with `package.json` file. The file is
 * same as a standard JSON file, but with some special methods
 * related to package file itself.
 */
export class PackageJsonFile extends File {
  public filePointer: ReturnType<typeof packageJson>

  /**
   * Collection of actions to be executed on package file
   */
  protected actions = []

  /**
   * A copy of install instructions
   */
  protected packages: {
    install: { dependency: string, version: string, dev: boolean }[],
    uninstall: { dependency: string, dev: boolean }[],
  } = {
    install: [],
    uninstall: [],
  }

  /**
   * Explicitly force to use yarn instead of npm
   */
  private useYarn: boolean | null = null

  /**
   * Method invoked before installing dependencies
   */
  private beforeInstallHooks?: InstallerNotifier

  /**
   * Method invoked before uninstalling dependencies
   */
  private beforeUninstallHooks?: InstallerNotifier

  constructor (basePath: string, private installerOutput: StdioOptions = 'pipe') {
    super(basePath)
    this.cdIn()
    this.filePointer = packageJson()
    this.cdOut()
  }

  /**
   * Run hooks for action or uninstall action
   */
  private runHooks (action: InstallerFns, list: string[], dev: boolean) {
    if (action === 'install' && typeof (this.beforeInstallHooks) === 'function') {
      this.beforeInstallHooks(list, dev)
    } else if (action === 'uninstall' && typeof (this.beforeUninstallHooks) === 'function') {
      this.beforeUninstallHooks(list, dev)
    }
  }

  /**
   * Sets installation client
   */
  private setClient (options: NpmOptions) {
    if (this.useYarn !== null) {
      options.yarn = this.useYarn
    }
  }

  /**
   * Executes the installer `install` or `uninstall` action. Use
   * `this.installerFnAsync` for async version
   */
  private installerFn (action: InstallerFns, list: string[], options: NpmOptions) {
    if (!list.length) {
      return
    }

    this.setClient(options)
    this.runHooks(action, list, options.dev!)

    const fn = action === 'install' ? install : uninstall
    return fn(list, options, (command: string, args: string[]) => {
      return spawnSync(command, args, { stdio: this.installerOutput })
    }) as SpawnSyncReturns<Buffer>
  }

  /**
   * Executes the installer `install` or `uninstall` action. Use
   * `this.installerFn` for sync version
   */
  private installerFnAsync (action: InstallerFns, list: string[], options: NpmOptions) {
    return new Promise<undefined | SpawnSyncReturns<Buffer>>((resolve) => {
      if (!list.length) {
        resolve()
        return
      }

      this.setClient(options)
      this.runHooks(action, list, options.dev!)

      let response: SpawnSyncReturns<Buffer>

      const fn = action === 'install' ? install : uninstall
      fn(list, options, (command: string, args: string[]) => {
        const runner = spawn(command, args, { stdio: 'pipe' })
        response = {
          pid: runner.pid,
          output: [],
          stdout: Buffer.from(''),
          stderr: Buffer.from(''),
          status: null,
          signal: null,
        }

        runner.stdout.on('data', (chunk) => {
          response.stdout = Buffer.concat([response.stdout, chunk])
        })

        runner.stderr.on('data', (chunk) => {
          response.stderr = Buffer.concat([response.stderr, chunk])
        })

        runner.on('close', (code, signal) => {
          response.status = code
          response.signal = signal
          resolve(response)
        })
      })
    })
  }

  /**
   * Install and uninstall packages defined via `this.install`
   * and `this.uninstall`
   */
  private commitDependencies (installs: Dependencies[], uninstalls: Dependencies[]) {
    let response: SpawnSyncReturns<Buffer> | undefined

    for (let { list, versions, dev } of installs) {
      response = this.installerFn('install', list, { versions, dev })
      if (response && response.status === 1) {
        return response
      }
    }

    for (let { list, dev } of uninstalls) {
      response = this.installerFn('uninstall', list, { dev })
      if (response && response.status === 1) {
        return response
      }
    }
  }

  /**
   * Performing uninstalling as a rollback step. Which means, this method
   * will remove packages marked for installation.
   */
  private rollbackDependencies (installs: Dependencies[]) {
    let response: SpawnSyncReturns<Buffer> | undefined

    for (let { list, dev } of installs) {
      response = this.installerFn('uninstall', list, { dev })
      if (response && response.status === 1) {
        return response
      }
    }
  }

  /**
   * Same as `commitInstalls` but async
   */
  private async commitDependenciesAsync (installs: Dependencies[], uninstalls: Dependencies[]) {
    let response: SpawnSyncReturns<Buffer> | undefined

    for (let { list, versions, dev } of installs) {
      response = await this.installerFnAsync('install', list, { versions, dev })
      if (response && response.status === 1) {
        return response
      }
    }

    for (let { list, dev } of uninstalls) {
      response = await this.installerFnAsync('uninstall', list, { dev })
      if (response && response.status === 1) {
        return response
      }
    }
  }

  /**
   * Same as `rollbackInstalls` but async.
   */
  private async rollbackDependenciesAsync (installs: Dependencies[]) {
    let response: SpawnSyncReturns<Buffer> | undefined

    for (let { list, dev } of installs) {
      response = await this.installerFnAsync('uninstall', list, { dev })
      if (response && response.status === 1) {
        return response
      }
    }
  }

  /**
   * Commits actions defined on the given file
   */
  private commitActions (): boolean {
    const actions = this.getCommitActions()
    const deleteFile = actions.find(({ action }) => action === 'delete')

    /**
     * In case of `delete` action. There is no point running
     * other actions and we can simply delete the file
     */
    if (deleteFile) {
      this.filePointer.delete()
      this.cdOut()
      return false
    }

    /**
     * Executing all actions
     */
    actions.forEach(({ action, body }) => {
      if (['set', 'unset'].indexOf(action) > -1) {
        this.filePointer[action](body.key, body.value)
        return
      }

      if (['prependScript', 'appendScript', 'setScript', 'removeScript'].indexOf(action) > -1) {
        this.filePointer[action](body.name, body.script)
        return
      }
    })

    /**
     * Save the file to the disk before starting install process.
     */
    this.filePointer.save()
    return true
  }

  /**
   * Rollsback actions defined on the package file
   */
  private rollbackActions () {
    const actions = this.getCommitActions()

    /**
     * Executing actions in reverse.
     */
    actions.forEach(({ action, body }) => {
      if (action === 'set') {
        this.filePointer.unset(body.key)
        return
      }

      if (action === 'setScript') {
        this.filePointer.removeScript(body.name)
        return
      }

      if (['prependScript', 'appendScript'].indexOf(action) > -1) {
        this.filePointer.removeScript(body.name, new RegExp(body.script))
        return
      }
    })

    /**
     * Write file to the disk
     */
    this.filePointer.save()
    return true
  }

  /**
   * Set key/value pair in the package.json file
   */
  public set (key: string, value: any): this {
    this.addAction('set', { key, value })
    return this
  }

  /**
   * Enable/disable use of yarn
   */
  public yarn (useYarn: boolean): this {
    this.useYarn = useYarn
    return this
  }

  /**
   * Unset key/value pair from the package.json file
   */
  public unset (key: string): this {
    this.addAction('unset', { key })
    return this
  }

  /**
   * Set package.json script
   */
  public setScript (name: string, script: string): this {
    this.addAction('setScript', { name, script })
    return this
  }

  /**
   * Append to existing package.json script
   */
  public appendScript (name: string, script: string) {
    this.addAction('appendScript', { name, script })
    return this
  }

  /**
   * Prepend to existing package.json script
   */
  public prependScript (name: string, script: string) {
    this.addAction('prependScript', { name, script })
    return this
  }

  /**
   * Remove existing script or remove a given action from an
   * existing script
   */
  public removeScript (name: string, script?: string | RegExp) {
    this.addAction('removeScript', { name, script })
    return this
  }

  /**
   * Install dependencies
   */
  public install (
    dependency: string,
    version: string = 'latest',
    dev: boolean = true,
  ) {
    this.packages.install.push({ dependency, version, dev })
    return this
  }

  /**
   * Uninstall dependencies
   */
  public uninstall (dependency: string, dev: boolean = true) {
    this.packages.uninstall.push({ dependency, dev })
    return this
  }

  /**
   * Remove file
   */
  public delete () {
    this.addAction('delete')
    return this
  }

  /**
   * Returns value for a given key from the file
   */
  public get (): any
  public get (address: string | string[], defaultValue?: any): any
  public get (address?: string | string[], defaultValue?: any): any {
    return address ? this.filePointer.get(address, defaultValue) : this.filePointer.get()
  }

  /**
   * A boolean telling if the file already exists
   */
  public exists () {
    return this.filePointer.exists()
  }

  /**
   * Returns a list of dependencies along with specific versions (if any)
   */
  public getInstalls (dev: boolean = true) {
    const dependencies: Dependencies = { versions: {}, list: [], dev }

    return this.packages.install.reduce((result, dependency) => {
      if (dependency.dev && dev) {
        result.list.push(dependency.dependency)
        if (dependency.version !== 'latest') {
          result.versions[dependency.dependency] = dependency.version
        }
      } else if (!dependency.dev && !dev) {
        result.list.push(dependency.dependency)
        if (dependency.version !== 'latest') {
          result.versions[dependency.dependency] = dependency.version
        }
      }

      return result
    }, dependencies)
  }

  /**
   * Returns uninstalls list for prod or development
   * dependencies.
   */
  public getUninstalls (dev: boolean) {
    const dependencies: Dependencies = { list: [], dev }

    return this.packages.uninstall.reduce((result, dependency) => {
      if (dependency.dev && dev) {
        result.list.push(dependency.dependency)
      } else if (!dependency.dev && !dev) {
        result.list.push(dependency.dependency)
      }

      return result
    }, dependencies)
  }

  /**
   * Define a function to be called before installing dependencies
   */
  public beforeInstall (callback: InstallerNotifier): this {
    this.beforeInstallHooks = callback
    return this
  }

  /**
   * Define a function to be called before uninstalling dependencies
   */
  public beforeUninstall (callback: InstallerNotifier): this {
    this.beforeUninstallHooks = callback
    return this
  }

  /**
   * Commit mutations
   */
  public commit () {
    this.cdIn()

    const success = this.commitActions()
    if (!success) {
      return
    }

    /**
     * Install/uninstall dependencies
     */
    const response = this.commitDependencies(
      [this.getInstalls(true), this.getInstalls(false)],
      [this.getUninstalls(true), this.getUninstalls(false)],
    )

    this.cdOut()
    return response
  }

  /**
   * Commits async. The files are still written using synchronous
   * API. However, the install and uninstall becomes async.
   */
  public async commitAsync () {
    this.cdIn()

    const success = this.commitActions()
    if (!success) {
      return
    }

    /**
     * Install/uninstall dependencies
     */
    const response = await this.commitDependenciesAsync(
      [this.getInstalls(true), this.getInstalls(false)],
      [this.getUninstalls(true), this.getUninstalls(false)],
    )

    this.cdOut()
    return response
  }

  /**
   * Rollback mutations
   */
  public rollback () {
    this.cdIn()

    const success = this.rollbackActions()
    if (!success) {
      return
    }

    /**
     * Uninstalling installed packages
     */
    const response = this.rollbackDependencies([
      this.getInstalls(true),
      this.getInstalls(false),
    ])

    this.cdOut()
    return response
  }

  /**
   * Rollsback async. The files are still written using synchronous
   * API. However, the uninstall becomes async.
   */
  public async rollbackAsync () {
    this.cdIn()

    const success = this.rollbackActions()
    if (!success) {
      return
    }

    /**
     * Uninstalling installed packages
     */
    const response = await this.rollbackDependenciesAsync([
      this.getInstalls(true),
      this.getInstalls(false),
    ])

    this.cdOut()
    return response
  }
}
