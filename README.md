# @adonisjs/sink
> A collection of utilities for creating AdonisJs packages and boilerplates.

[![circleci-image]][circleci-url] [![npm-image]][npm-url] ![][typescript-image] [![license-image]][license-url]

AdonisJs sink is a collection of file utilities to mutate the contents of a file with support for **partial updates**, automatic **commits** and **rollbacks**.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## Table of contents

- [Usage](#usage)
- [Maintainers](#maintainers)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Usage
Install the package from npm as follows:

```sh
npm i @adonisjs/sink

# Yarn
yarn add @adonisjs/sink
```

and then use it as follows:

```ts
import { PackageFile } from '@adonisjs/sink'

const pkg = new PackageFile(process.cwd())

pkg.setScript('build', 'tsc')
pkg.install(['typescript', 'tslint'])

pkg.commit()
```

You will use this package when creating your own boilerplates for AdonisJs or when you want to run instructions using `instructions.ts` file.

In both the places, you will get the `basePath` of the application from AdonisJs itself.

## Maintainers
[Harminder virk](https://github.com/thetutlage)

[circleci-image]: https://img.shields.io/circleci/project/github/adonisjs/sink/master.svg?style=for-the-badge&logo=circleci
[circleci-url]: https://circleci.com/gh/adonisjs/sink "circleci"

[npm-image]: https://img.shields.io/npm/v/@adonisjs/sink.svg?style=for-the-badge&logo=npm
[npm-url]: https://npmjs.org/package/@adonisjs/sink "npm"

[typescript-image]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript

[license-url]: LICENSE.md
[license-image]: https://img.shields.io/aur/license/pac.svg?style=for-the-badge
