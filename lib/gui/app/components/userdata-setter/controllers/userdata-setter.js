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
const store = require('../../../models/store')
const analytics = require('../../../modules/analytics')
const selectionState = require('../../../models/selection-state')
const utils = require('../../../../../shared/utils')
const angular = require('angular')
const userdata = require('../../../models/userdatas')
const osDialog = require('../../../os/dialog')
const exceptionReporter = require('../../../modules/exception-reporter')

module.exports = function (
  $scope,
  $uibModalInstance
) {
  /*
  -------------------------------
  Const Value
  -------------------------------
  */
  this.TOPPAGE = 0

  this.UNSET_NUMBER = -1

  this.HEAD_OF_SCAN = 0

  this.INDEX_OF_PAGE = {
    rdboxClusterWelcom: 0,
    rdboxClusterNew: 1,
    rdboxClusterPreviously: 2,
    rdboxTypeHw: 3,
    rdboxTypeRole: 4,
    rdboxClusterSuffix: 5,
    rdboxClusterHostname: 6,
    rdboxUserdataUserinfo: 7,
    rdboxAllFinish: 8
  }

  this.INDEX_OF_RDBOX_HW = {
    APOnly: 0,
    SimpleMesh: 1,
    FullMesh: 2
  }

  this.INDEX_OF_RDBOX_ROLE = {
    LeaderMaster: 0,
    BranchMaster: 1,
    Slave: 2,
    Other: 3,
    VPNBridge: 4
  }

  this.REVERSE_RESOLUTION_RDBOX_ROLE = [
    'master',
    'master',
    'slave',
    '',
    'vpnbridge'
  ]

  this.INDEX_OF_RDBOX_ROLE = {
    LeaderMaster: 0,
    BranchMaster: 1,
    Slave: 2,
    Other: 3,
    VPNBridge: 4
  }

  this.INDEX_OF_RDBOX_HW = {
    APOnly: 0,
    SimpleMesh: 1,
    FullMesh: 2
  }

  /**
   * @summary Form datas
   * @type {Object}
   * @public
   */
  this.formDatas = {
    // Always changed.
    clustername: '',
    clustercomment: '',
    rdboxHardWare: '',
    rdboxRole: '',
    hostnameSuffix: '',
    hostname: '',

    // Also use history.
    username: '',
    password: '',
    publicKey: '',
    secretKey: '',
    authorizedKeys: ''
  }

  /*
  -------------------------------
  Screen Operation Value
  -------------------------------
  */
  this.currentPage = this.TOPPAGE
  this.historyOfPage = [ this.TOPPAGE ]
  this.scanLineOfHistoryOfPage = 0
  this.lastHoverRole = this.UNSET_NUMBER
  this.isInvalidCurrentPage = true

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

  /**
   * @summary past information userdata model.
   * @type {Object}
   * @public
   */
  this.historyUserData = _.cloneDeep(this.currentUserData)

  this.pushNewUserData = () => {
    this.userdata.pushNewUserData(this.currentUserData, this.formDatas.clustername, this.formDatas.clustercomment)
  }

  this.dumpYaml = () => {
    return this.userdata.dumpYaml(this.currentUserData)
  }

  this.resetHostnameFlg = () => {
    this.userdata.resetHostnameFlg(this.currentUserData)
  }

  this.setHostnameFlg = () => {
    this.userdata.setHostnameFlg(this.currentUserData)
  }

  this.getListOfUserData = () => {
    return this.userdata.getListOfUserData(this.currentUserData)
  }

  this.getUsernameOfRoot = () => {
    return this.userdata.getUsernameOfRoot(this.currentUserData)
  }

  this.getPublicKeyOfRoot = () => {
    return this.userdata.getPublicKeyOfRoot(this.currentUserData)
  }

  this.getSecretKeyOfRoot = () => {
    return this.userdata.getSecretKeyOfRoot(this.currentUserData)
  }

  this.getClusterIdByIndex = (indexNo) => {
    return this.userdata.getClusterIdByIndex(this.currentUserData, indexNo)
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

  this.resetForm = () => {
    this.formDatas.hostname = ''
    this.formDatas.clustername = ''
    this.formDatas.clustercomment = ''
    this.formDatas.rdboxHardWare = ''
    this.formDatas.rdboxRole = ''
    this.formDatas.hostnameSuffix = ''
  }

  this.resetAll = () => {
    this.currentPage = this.TOPPAGE
    this.historyOfPage = [ this.TOPPAGE ]
    this.scanLineOfHistoryOfPage = 0
    this.lastHoverRole = this.UNSET_NUMBER
    this.resetForm()
  }

  this.reloadFormDatas = () => {
    this.formDatas.username = this.getUsernameOfRoot()
    this.formDatas.publicKey = this.getPublicKeyOfRoot()
    this.formDatas.secretKey = this.getSecretKeyOfRoot()
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
   * UserdataSetterController.setFromPathOfFiles(userdatas, 'publicKey', '/Users/hoge/.ssh/id_rsa.pub')
   */
  this.setFromPathOfFiles = (userdatas, id, fromPath) => {
    this.userdata.setFromPathOfFiles(userdatas, id, fromPath)
  }

  /**
   * @summary Set the hostname of currentCluster.
   * @function
   * @public
   * @param {String} hostname - hostname
   * @example
   * UserdataSetterController.setHostnameOfCurrentCluster(userdatas, 'rdbox-master-00')
   */
  this.setHostnameOfCurrentCluster = (hostname) => {
    this.userdata.setHostnameOfCurrentCluster(this.currentUserData, hostname)
  }

  /**
   * @summary Set the indexNo of currentCluster.
   * @function
   * @public
   * @param {Int} indexNo - indexNo
   * @example
   * UserdataSetterController.setIndexOfCurrentCluster(userdatas, 1)
   */
  this.setIndexOfCurrentCluster = (indexNo) => {
    this.userdata.setIndexOfCurrentCluster(this.currentUserData, indexNo)
  }

  /**
   * @summary get secret file path.
   * @function
   * @public
   *
   * @param {Object} modal - object of modal
   * @param {Object} id - id of secret file.(publicKey, secretKey ,etc....)
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

        if (id === 'publicKey') {
          this.formDatas.publicKey = ''
        } else if (id === 'secretKey') {
          this.formDatas.secretKey = ''
        } else {
          this.formDatas.publicKey = ''
          this.formDatas.secretKey = ''
        }

        // A screen update is required.
        modal.$apply()
        return
      }

      // Update Form
      if (id === 'publicKey') {
        this.formDatas.publicKey = keyFile
      } else if (id === 'secretKey') {
        this.formDatas.secretKey = keyFile
      }

      // A screen update is required.
      modal.$apply()

      // Update userdatas
      this.setFromPathOfFiles(this.currentUserData, id, keyFile)
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
    if (id === 'publicKey') {
      this.formDatas.publicKey = 'a'
    } else if (id === 'secretKey') {
      this.formDatas.secretKey = 'a'
    }
    this.secretSelector(modal, id)
  }

  this.selectHW = (typeHW) => {
    this.formDatas.hostname = ''
    this.formDatas.rdboxHardWare = typeHW
    if (this.formDatas.rdboxHardWare === this.INDEX_OF_RDBOX_HW.APOnly) {
      this.formDatas.hostname = `${this.formDatas.clustername}-master-00`
    }
  }

  this.hoverRole1Line = (item) => {
    if (this.formDatas.rdboxRole === '') {
      this.lastHoverRole = item
    } else {
      this.lastHoverRole = this.formDatas.rdboxRole
    }
  }

  this.selectRole1Line = (item) => {
    this.formDatas.hostname = ''
    this.formDatas.rdboxRole = item
    this.lastHoverRole = item
    if (this.formDatas.rdboxHardWare !== this.INDEX_OF_RDBOX_HW.APOnly &&
      this.formDatas.rdboxRole === this.INDEX_OF_RDBOX_ROLE.LeaderMaster) {
      this.formDatas.hostname = `${this.formDatas.clustername}-master-00`
    }
  }

  this.changeHostnameSuffix = () => {
    const hn = `${this.formDatas.clustername}-${this.REVERSE_RESOLUTION_RDBOX_ROLE[this.formDatas.rdboxRole]}-${this.formDatas.hostnameSuffix}`
    if (_.isNil(this.formDatas.hostnameSuffix)) {
      this.formDatas.hostname = '?????'
    } else {
      if (this.formDatas.rdboxRole === this.INDEX_OF_RDBOX_ROLE.BranchMaster && this.formDatas.hostnameSuffix === '00') {
        this.formDatas.hostnameSuffix = ''
        this.formDatas.hostname = '?????'
        return
      }
      this.formDatas.hostname = hn
      this.setHostnameOfCurrentCluster(this.formDatas.hostname)
    }
  }

  this.changeHostnameForOther = () => {
    this.setHostnameOfCurrentCluster(this.formDatas.hostname)
  }

  this.getCountPreviouslyClusterLeder = (cluster) => {
    if (cluster.clusterData.master00) {
      // eslint-disable-next-line no-magic-numbers
      return 1
    }
    // eslint-disable-next-line no-magic-numbers
    return 0
  }

  this.getCountPreviouslyClusterBranch = (cluster) => {
    return cluster.clusterData.masterBase.length
  }

  this.getCountPreviouslyClusterSlave = (cluster) => {
    return cluster.clusterData.slave.length
  }

  this.getStringMeshModePreviouslyCluster = (cluster) => {
    if (cluster.clusterData.isSimple) {
      return 'SimpleMode'
    }
    return 'FullMode'
  }

  this.selectPreviouslyCluster = (cluster, index) => {
    if (this.getClusterIdByIndex(index) === cluster.clusterData.id) {
      this.formDatas.clustername = cluster.clusterData.id
      this.formDatas.clustercomment = cluster.clusterData.comment
      this.setIndexOfCurrentCluster(index)
    }
  }

  this.backModal = () => {
    if (this.scanLineOfHistoryOfPage === this.HEAD_OF_SCAN) {
      this.scanLineOfHistoryOfPage += 1
      this.currentPage = this.historyOfPage[this.historyOfPage.length - this.scanLineOfHistoryOfPage - 1]
      this.historyOfPage.pop()
      this.scanLineOfHistoryOfPage -= 1
    } else {
      this.scanLineOfHistoryOfPage += 1
      // eslint-disable-next-line no-magic-numbers
      this.currentPage = this.historyOfPage[this.historyOfPage.length - this.scanLineOfHistoryOfPage - 1]
    }
    if (this.currentPage === this.TOPPAGE) {
      this.resetAll()
      this.currentUserData = this.getUserdata()
    } else if (this.currentPage === this.INDEX_OF_PAGE.rdboxClusterPreviously ||
      this.currentPage === this.INDEX_OF_PAGE.rdboxClusterPreviously) {
      this.formDatas.rdboxHardWare = ''
    } else if (this.currentPage === this.INDEX_OF_PAGE.rdboxTypeHw) {
      this.formDatas.rdboxRole = ''
      this.lastHoverRole = this.UNSET_NUMBER
    } else if (this.currentPage === this.INDEX_OF_PAGE.rdboxTypeRole) {
      this.formDatas.hostnameSuffix = ''
    }
    this.monitorRdboxForm()
  }

  this.nextModal = (nextPage = this.UNSET_NUMBER) => {
    if (this.scanLineOfHistoryOfPage === this.HEAD_OF_SCAN) {
      if (nextPage === this.UNSET_NUMBER) {
        this.currentPage = this.getDestinationOfPage(this.currentPage)
      } else {
        this.currentPage = nextPage
      }
    } else {
      this.scanLineOfHistoryOfPage -= 1
      // eslint-disable-next-line no-magic-numbers
      this.currentPage = this.historyOfPage[this.historyOfPage.length - this.scanLineOfHistoryOfPage - 1]
    }
    if (!_.includes(this.historyOfPage, this.currentPage)) {
      this.historyOfPage.push(this.currentPage)
    }
    this.monitorRdboxForm()
  }

  // eslint-disable-next-line lodash/prefer-constant
  this.isBackButtonDisabled = () => {
    return false
  }

  this.isNextButtonDisabled = () => {
    return this.isInvalidCurrentPage
  }

  // eslint-disable-next-line lodash/prefer-constant
  this.isCompleteButtonDisabled = () => {
    return false
  }

  this.isBackButtonHidden = () => {
    if (this.currentPage === this.INDEX_OF_PAGE.rdboxClusterWelcom) {
      return true
    }
    if (this.currentPage === this.INDEX_OF_PAGE.rdboxAllFinish) {
      return true
    }
    return false
  }

  this.isNextButtonHidden = () => {
    if (this.currentPage === this.INDEX_OF_PAGE.rdboxClusterWelcom) {
      return true
    }
    if (this.currentPage === this.INDEX_OF_PAGE.rdboxAllFinish) {
      return true
    }
    return false
  }

  this.isCompleteButtonHidden = () => {
    if (this.currentPage === this.INDEX_OF_PAGE.rdboxClusterWelcom) {
      return true
    }
    if (this.currentPage === this.INDEX_OF_PAGE.rdboxAllFinish) {
      return false
    }
    return true
  }

  this.getKeyFromValue = (object, index) => {
    const key = _.findKey(object, (value) => {
      return value === index
    })
    return key
  }

  this.getDestinationOfPage = (index) => {
    const pager = {
      rdboxClusterWelcom: () => {
        return this.INDEX_OF_PAGE.rdboxClusterNew
      },
      rdboxClusterNew: () => {
        this.pushNewUserData()
        this.reloadFormDatas()
        return this.INDEX_OF_PAGE.rdboxTypeHw
      },
      rdboxClusterPreviously: () => {
        this.reloadFormDatas()
        return this.INDEX_OF_PAGE.rdboxTypeHw
      },
      rdboxTypeHw: () => {
        if (this.formDatas.rdboxHardWare === this.INDEX_OF_RDBOX_HW.APOnly) {
          return this.INDEX_OF_PAGE.rdboxClusterHostname
        }
        return this.INDEX_OF_PAGE.rdboxTypeRole
      },
      rdboxTypeRole: () => {
        if (this.formDatas.rdboxRole === this.INDEX_OF_RDBOX_ROLE.LeaderMaster) {
          return this.INDEX_OF_PAGE.rdboxClusterHostname
        } else if (this.formDatas.rdboxRole === this.INDEX_OF_RDBOX_ROLE.Other) {
          return this.INDEX_OF_PAGE.rdboxClusterHostname
        }
        return this.INDEX_OF_PAGE.rdboxClusterSuffix
      },
      rdboxClusterSuffix: () => {
        return this.INDEX_OF_PAGE.rdboxClusterHostname
      },
      rdboxClusterHostname: () => {
        return this.INDEX_OF_PAGE.rdboxUserdataUserinfo
      },
      rdboxUserdataUserinfo: () => {
        return this.INDEX_OF_PAGE.rdboxAllFinish
      },
      rdboxAllFinish: () => {
        return this.INDEX_OF_PAGE.rdboxAllFinish
      }
    }
    const pageName = this.getKeyFromValue(this.INDEX_OF_PAGE, index)
    this.monitorRdboxForm()
    if (this.isInvalidCurrentPage) {
      return this.currentPage
    }
    return pager[pageName]()
  }

  this.monitorRdboxForm = () => {
    const pageName = this.getKeyFromValue(this.INDEX_OF_PAGE, this.currentPage)
    const hasKey = _.get($scope.pages, pageName, 'NOT_FOUND')
    if (hasKey === 'NOT_FOUND') {
      this.isInvalidCurrentPage = false
    } else {
      this.isInvalidCurrentPage = $scope.pages[pageName].$invalid
    }
  }
}
