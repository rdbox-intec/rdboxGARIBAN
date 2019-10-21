/*
 * Copyright 2019 RDBOX Inc.
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

/**
 * @module Etcher.Models.userdata
 */

const _ = require('lodash')

/**
 * @summary Default settings
 * @constant
 * @type {Object}
 */
const DEFAULT_SETTINGS = {
  yourSiteSSID: 'TEST'
}

/**
 * @summary Settings state
 * @type {Object}
 * @private
 */
let settings = _.cloneDeep(DEFAULT_SETTINGS)

/**
 * @summary Reset settings to their default values
 * @function
 * @public
 *
 * @example
 * settings.reset().then(() => {
 *   console.log('Done!');
 * });
 */
exports.reset = () => {
  settings = _.cloneDeep(DEFAULT_SETTINGS)
}

/**
 * @summary Get a setting value
 * @function
 * @public
 *
 * @param {String} key - setting key
 * @returns {*} setting value
 *
 * @example
 * const value = settings.get('unmountOnSuccess');
 */
exports.get = (key) => {
  return _.cloneDeep(_.get(settings, [ key ]))
}

/**
 * @summary Check if setting value exists
 * @function
 * @public
 *
 * @param {String} key - setting key
 * @returns {Boolean} exists
 *
 * @example
 * const hasValue = settings.has('unmountOnSuccess');
 */
exports.has = (key) => {
  /* eslint-disable no-eq-null */
  return settings[key] != null
}

/**
 * @summary Get all setting values
 * @function
 * @public
 *
 * @returns {Object} all setting values
 *
 * @example
 * const allSettings = settings.getAll();
 * console.log(allSettings.unmountOnSuccess);
 */
exports.getAll = () => {
  return _.cloneDeep(settings)
}
