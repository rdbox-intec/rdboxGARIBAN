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

const _ = require('lodash')
const angular = require('angular')
const prettyBytes = require('pretty-bytes')
const store = require('../../../models/store')
const settings = require('../../../models/settings')
const selectionState = require('../../../models/selection-state')
const analytics = require('../../../modules/analytics')
const exceptionReporter = require('../../../modules/exception-reporter')
const utils = require('../../../../../shared/utils')

module.exports = function (ConfigSetterService) {
  /**
   * @summary Open config selector
   * @function
   * @public
   *
   * @example
   * ConfigSetterController.openConfigSetter();
   */
  this.openConfigSetter = () => {
    ConfigSetterService.open().then((config) => {
      if (!config) {
        return
      }

    }).catch(exceptionReporter.report)
  }
}
