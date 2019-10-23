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

/**
 * @module Etcher.Models.Userdata
 */

const _ = require('lodash')
const Bluebird = require('bluebird')
const localUserdatas = require('./local-userdatas')
const errors = require('../../../shared/errors')
const debug = require('debug')('etcher:models:settings')

/**
 * @summary Default userdatas
 * @constant
 * @type {Object}
 */
const DEFAULT_USERDATAS = {
  hostName: 'rdbox-master-00',
  userNama: 'ubuntu',
  yourSiteSSID: 'TESTSSID00'
}

/**
 * @summary Userdatas state
 * @type {Object}
 * @private
 */
let userdatas = _.cloneDeep(DEFAULT_USERDATAS)

/**
 * @summary Reset userdatas to their default values
 * @function
 * @public
 *
 * @returns {Promise}
 *
 * @example
 * userdatas.reset().then(() => {
 *   console.log('Done!');
 * });
 */
exports.reset = () => {
  debug('reset')

  // TODO: Remove default userdatas from config file (?)
  userdatas = _.cloneDeep(DEFAULT_USERDATAS)
  return localUserdatas.writeAll(userdatas)
}

/**
 * @summary Extend the current userdatas
 * @function
 * @public
 *
 * @param {Object} value - value
 * @returns {Promise}
 *
 * @example
 * userdatas.assign({
 *   foo: 'bar'
 * }).then(() => {
 *   console.log('Done!');
 * });
 */
exports.assign = (value) => {
  debug('assign', value)
  if (_.isNil(value)) {
    return Bluebird.reject(errors.createError({
      title: 'Missing userdatas'
    }))
  }

  if (!_.isPlainObject(value)) {
    return Bluebird.reject(errors.createError({
      title: 'Userdatas must be an object'
    }))
  }

  const newSettings = _.assign({}, userdatas, value)

  return localUserdatas.writeAll(newSettings)
    .then((updatedSettings) => {
      // NOTE: Only update in memory userdatas when successfully written
      userdatas = updatedSettings
    })
}

/**
 * @summary Extend the application state with the local userdatas
 * @function
 * @public
 *
 * @returns {Promise}
 *
 * @example
 * userdatas.load().then(() => {
 *   console.log('Done!');
 * });
 */
exports.load = () => {
  debug('load')
  return localUserdatas.readAll().then((loadedSettings) => {
    return _.assign(userdatas, loadedSettings)
  })
}

/**
 * @summary Set a userdata value
 * @function
 * @public
 *
 * @param {String} key - userdata key
 * @param {*} value - userdata value
 * @returns {Promise}
 *
 * @example
 * userdatas.set('userName', true).then(() => {
 *   console.log('Done!');
 * });
 */
exports.set = (key, value) => {
  debug('set', key, value)
  if (_.isNil(key)) {
    return Bluebird.reject(errors.createError({
      title: 'Missing userdata key'
    }))
  }

  if (!_.isString(key)) {
    return Bluebird.reject(errors.createError({
      title: `Invalid userdata key: ${key}`
    }))
  }

  const previousValue = userdatas[key]

  userdatas[key] = value

  return localUserdatas.writeAll(userdatas)
    .catch((error) => {
      // Revert to previous value if persisting userdatas failed
      userdatas[key] = previousValue
      throw error
    })
}

/**
 * @summary Get a userdata value
 * @function
 * @public
 *
 * @param {String} key - userdata key
 * @returns {*} userdata value
 *
 * @example
 * const value = userdatas.get('userName');
 */
exports.get = (key) => {
  return _.cloneDeep(_.get(userdatas, [ key ]))
}

/**
 * @summary Check if userdata value exists
 * @function
 * @public
 *
 * @param {String} key - userdata key
 * @returns {Boolean} exists
 *
 * @example
 * const hasValue = userdatas.has('userName');
 */
exports.has = (key) => {
  /* eslint-disable no-eq-null */
  return userdatas[key] != null
}

/**
 * @summary Get all userdata values
 * @function
 * @public
 *
 * @returns {Object} all userdata values
 *
 * @example
 * const allSettings = userdatas.getAll();
 * console.log(allSettings.userName);
 */
exports.getAll = () => {
  debug('getAll')
  return _.cloneDeep(userdatas)
}

/**
 * @summary Get the default userdata values
 * @function
 * @public
 *
 * @returns {Object} all userdata values
 *
 * @example
 * const defaults = userdatas.getDefaults();
 * console.log(defaults.userName);
 */
exports.getDefaults = () => {
  debug('getDefaults')
  return _.cloneDeep(DEFAULT_USERDATAS)
}

/**
 * @summary Write local all userdatas
 * @function
 * @public
 *
 * @param {Object} uds - userdatas
 * @fulfil {Object} uds - userdatas
 * @returns {Promise}
 * @example
 * localUserdatas.writeAll({
 *   foo: 'bar'
 * }).then(() => {
 *   console.log('Done!');
 * });
 */
exports.setAll = (uds) => {
  return localUserdatas.writeAll(uds).catch((error) => {
    console.log('Done!')
    throw error
  })
}
