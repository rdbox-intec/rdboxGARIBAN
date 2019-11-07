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
const utils = require('../../../../../shared/utils')
const angular = require('angular')
const userdata = require('../../../models/userdatas')
const osDialog = require('../../../os/dialog')
const exceptionReporter = require('../../../modules/exception-reporter')

module.exports = function (
  $uibModalInstance
) {
  this.currentPage = 0

  this.rdboxHardWare = ''

  this.lastHoverRole = -1

  this.rdboxRole = -1

  /**
   * @summary The userdata model
   * @type {Object}
   * @public
   */
  this.userdata = userdata

  /**
   * @summary Memoized getAll function
   * @function
   * @public
   *
   * @returns {Object} - memoized list of userdata
   *
   * @example
   * const drives = UserdataSetterController.getUserdata()
   */
  this.getUserdata = utils.memoize(this.userdata.getAll, angular.equals)

  /**
   * @summary The temp userdata model
   * @type {Object}
   * @public
   */
  this.currentUserData = this.getUserdata()

  this.dumpYaml = () => {
    return this.userdata.dumpYaml(this.currentUserData)
  }

  this.resetHostnameFlg = () => {
    this.userdata.resetHostnameFlg(this.currentUserData)
  }

  this.setHostnameFlg = () => {
    this.userdata.setHostnameFlg(this.currentUserData)
  }

  /**
   * @summary save userdata and close the modal
   * @function
   * @public
   *
   * @example
   * UserdataSetterController.saveUserdataAndClose();
   */
  this.saveUserdataAndClose = () => {
    this.dumpYaml()
    this.resetHostnameFlg()
    this.userdata.setAll(this.currentUserData)
    this.setHostnameFlg()
    selectionState.setUserdata(this.currentUserData)

    analytics.logEvent('Userdata saved (Complete))', {
      applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
      flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
    })

    this.closeModal()
  }

  /**
   * @summary Close the modal and resolve the set userdataure
   * @function
   * @public
   *
   * @example
   * UserdataSetterController.closeModal();
   */
  this.closeModal = () => {
    $uibModalInstance.close()
  }

  /**
   * @summary Get index of files at userdatas
   * @function
   * @public
   *
   * @param {String} id - id (ex. publickey, secretkey)
   * @returns {Int}
   * @example
   * UserdataSetterController.getIndexOfFiles('publicKey');
   */
  this.getIndexOfFiles = (id) => {
    return this.userdata.getIndexOfFiles(this.currentUserData, id)
  }

  /**
   * @summary Set from_path of userdatas files field.
   * @function
   * @public
   * @param {Object} userdatas - userdatas(json)
   * @param {String} id - id (ex. publickey, secretkey)
   * @param {String} fromPath - filepath
   * @example
   * UserdataSetterController.setFromPathOfFiles(userdatas, 'publicKey', '/Users/hoge/.ssh/id_rsa.pub');
   */
  this.setFromPathOfFiles = (userdatas, id, fromPath) => {
    this.userdata.setFromPathOfFiles(userdatas, id, fromPath)
  }

  /**
   * @summary get secret file path.
   * @function
   * @public
   *
   * @param {Object} modal - object of modal
   * @param {Object} id - id of files at userdatas
   * @example
   * UserdataSetterController.secretSelector(modal, id);
   */
  this.secretSelector = (modal, id) => {
    analytics.logEvent('Open image selector', {
      applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
      flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
    })

    osDialog.selectSecret().then((keyFile) => {
      // Avoid analytics and selection state changes
      // if no file was resolved from the dialog.
      if (!keyFile) {
        analytics.logEvent('keyFile selector closed', {
          applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
          flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
        })
        return
      }

      // Update userdatas(Files.publicKey)
      this.setFromPathOfFiles(this.currentUserData, id, keyFile)

      // A screen update is required.
      modal.$apply()
    }).catch(exceptionReporter.report)
  }

  /**
   * @summary Open the file window
   * @function
   * @public
   *
   * @param {Object} modal - object of modal
   * @param {Object} id - id of files at userdatas
   * @example
   * UserdataSetterController.openSecretSelector(modal, id);
   */
  this.openSecretSelector = (modal, id) => {
    this.secretSelector(modal, id)
  }

  this.backModal = () => {
    this.currentPage -= 1
    // eslint-disable-next-line no-magic-numbers
    if (this.currentPage < 0) {
      this.currentPage = 0
    }
  }

  this.nextModal = () => {
    this.currentPage += 1
  }

  this.selectHW = (typeHW) => {
    this.rdboxHardWare = typeHW
  }

  this.hoverRole1Line = (item) => {
    if (this.rdboxRole >= 0) {
      this.lastHoverRole = this.rdboxRole
    } else {
      this.lastHoverRole = item
    }
  }

  this.selectRole1Line = (item) => {
    this.rdboxRole = item
    this.lastHoverRole = item
  }
}