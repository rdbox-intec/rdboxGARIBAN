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

module.exports = function () {
  return {
    require: 'ngModel',
    link: (scope, elm, attrs, ctrl) => {
      ctrl.$validators.validExist = (modelValue, viewValue) => {
        // eslint-disable-next-line lodash/matches-prop-shorthand
        const result = _.find(scope.modal.currentUserData.userDatas, (item) => {
          return item.clusterData.id === viewValue
        })
        if (_.isUndefined(result)) {
          return true
        }
        return false
      }
    }
  }
}
