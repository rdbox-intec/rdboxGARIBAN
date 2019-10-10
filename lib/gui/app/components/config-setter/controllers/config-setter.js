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

const store = require('../../../models/store')
const analytics = require('../../../modules/analytics')
const selectionState = require('../../../models/selection-state')

module.exports = function (
  $uibModalInstance
) {
  /**
   * @summary save config and close the modal
   * @function
   * @public
   *
   * @param {Object} config - config
   *
   * @example
   * DriveSelectorController.saveConfigAndClose({
    *   device: '/dev/disk2',
    *   size: 999999999,
    *   name: 'Cruzer USB drive'
    * });
    */
  this.saveConfigAndClose = (config) => {
    selectionState.selectDrive(config.device)

    analytics.logEvent('Config saved (Complete))', {
      applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
      flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
    })

    this.closeModal()
  }

  /**
   * @summary Close the modal and resolve the set configure
   * @function
   * @public
   *
   * @example
   * ConfigSetterController.closeModal();
   */
  this.closeModal = () => {
    $uibModalInstance.close()
  }
}
