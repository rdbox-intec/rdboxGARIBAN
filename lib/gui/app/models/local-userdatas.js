/*
 * Copyright 2019 RDBOX Prj
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict'

const Bluebird = require('bluebird')
const fs = require('fs')
const path = require('path')

/**
 * @summary Number of spaces to indent JSON output with
 * @type {Number}
 * @constant
 */
const JSON_INDENT = 2

/**
 * @summary Userdatas directory path
 * @description
 * Defaults to the following:
 * - `%APPDATA%/etcher` on Windows
 * - `$XDG_CONFIG_HOME/etcher` or `~/.config/etcher` on Linux
 * - `~/Library/Application Support/etcher` on macOS
 * See https://electronjs.org/docs/api/app#appgetpathname
 * @constant
 * @type {String}
 */
const USER_DATA_DIR = (() => {
  // NOTE: The ternary is due to this module being loaded both,
  // Electron's main process and renderer process
  const electron = require('electron')
  return electron.app
    ? electron.app.getPath('userData')
    : electron.remote.app.getPath('userData')
})()

/**
 * @summary Configuration file path
 * @type {String}
 * @constant
 */
const USERDATAS_PATH = path.join(USER_DATA_DIR, 'userdatas.json')

/**
 * @summary Read a local userdatas.json file
 * @function
 * @private
 *
 * @param {String} filename - file path
 * @fulfil {Object} - userdatas
 * @returns {Promise}
 *
 * @example
 * readUserdatasFile('userdatas.json').then((userdatas) => {
 *   console.log(userdatas)
 * })
 */
const readUserdatasFile = (filename) => {
  return new Bluebird((resolve, reject) => {
    fs.readFile(filename, { encoding: 'utf8' }, (error, contents) => {
      let data = {}
      if (error) {
        if (error.code === 'ENOENT') {
          resolve(data)
        } else {
          reject(error)
        }
      } else {
        try {
          data = JSON.parse(contents)
        } catch (parseError) {
          console.error(parseError)
        }
        resolve(data)
      }
    })
  })
}

/**
 * @summary Write to the local userdatas file
 * @function
 * @private
 *
 * @param {String} filename - file path
 * @param {Object} data - data
 * @fulfil {Object} data - data
 * @returns {Promise}
 *
 * @example
 * writeUserdatasFile('userdatas.json', { something: 'good' })
 *   .then(() => {
 *     console.log('data written')
 *   })
 */
const writeUserdatasFile = (filename, data) => {
  return new Bluebird((resolve, reject) => {
    const contents = JSON.stringify(data, null, JSON_INDENT)
    fs.writeFile(filename, contents, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve(data)
      }
    })
  })
}

/**
 * @summary Read all local userdatas
 * @function
 * @public
 *
 * @fulfil {Object} - local userdatas
 * @returns {Promise}
 *
 * @example
 * localUserdatas.readAll().then((userdatas) => {
 *   console.log(userdatas);
 * });
 */
exports.readAll = () => {
  return readUserdatasFile(USERDATAS_PATH)
}

/**
 * @summary Write local userdatas
 * @function
 * @public
 *
 * @param {Object} userdatas - userdatas
 * @fulfil {Object} userdatas - userdatas
 * @returns {Promise}
 *
 * @example
 * localUserdatas.writeAll({
 *   foo: 'bar'
 * }).then(() => {
 *   console.log('Done!');
 * });
 */
exports.writeAll = (userdatas) => {
  return writeUserdatasFile(USERDATAS_PATH, userdatas)
}

/**
 * @summary Clear the local userdatas
 * @function
 * @private
 *
 * @description
 * Exported for testing purposes
 *
 * @returns {Promise}
 *
 * @example
 * localUserdatas.clear().then(() => {
 *   console.log('Done!');
 * });
 */
exports.clear = () => {
  return new Bluebird((resolve, reject) => {
    fs.unlink(USERDATAS_PATH, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}
