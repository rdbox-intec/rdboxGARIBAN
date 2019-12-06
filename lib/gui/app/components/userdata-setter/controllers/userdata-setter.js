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
const ct = require('countries-and-timezones')
const locale = require('locale-codes')
const country = require('country-list')
const angular = require('angular')
const crypto = require('crypto')
const errors = require('../../../../../shared/errors')
const store = require('../../../models/store')
const analytics = require('../../../modules/analytics')
const selectionState = require('../../../models/selection-state')
const utils = require('../../../../../shared/utils')
const userdata = require('../../../models/userdatas')
const osDialog = require('../../../os/dialog')
const exceptionReporter = require('../../../modules/exception-reporter')

module.exports = function (
  $scope,
  $uibModalInstance
) {
  /*
   * --------------------------------------------------------
   * Core Data
   * --------------------------------------------------------
   */

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

  /*
   * --------------------------------------------------------
   * Const Value
   * --------------------------------------------------------
   */
  this.TOPPAGE = 0

  this.UNSET_NUMBER = -1

  this.HEAD_OF_SCAN = 0

  this.WPA_PSK_LENGTH = 64

  this.SEED_OF_RANDOM_CHAR = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

  this.INDEX_OF_PAGE = {
    pageClusterWelcom: 0,
    pageClusterNew: 1,
    pageClusterPreviously: 2,
    pageTypeHw: 3,
    pageTypeRole: 4,
    pageClusterSuffix: 5,
    pageClusterHostname: 6,
    pageClusterApply: 7,
    pageUserdataUserinfo: 8,
    pageUserdataEnvinfo: 9,
    pageNetworkConnection: 10,
    pageNetworkProxy: 11,
    pageWifiBackend: 12,
    pageWifiApbg: 13,
    pageWifiApan: 14,
    pageVpnBridge: 15,
    pageJoinKubernetes: 16,
    pageAllFinish: 17
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

  this.REVERSE_RESOLUTION_ROLE = [
    'LeaderMaster',
    'BranchMaster',
    'Slave',
    'Other',
    'VPNBridge'
  ]

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

  this.SUPPORTED_LOCALES = [
    'en_US.UTF-8',
    'en_AU.UTF-8',
    'en_CA.UTF-8',
    'en_GB.UTF-8',
    'en_HK.UTF-8',
    'en_SG.UTF-8',
    'ja_JP.UTF-8',
    'zh_CN.UTF-8'
  ]

  this.INDEX_OF_TYPE_PROXY = {
    unnecessary: 'unnecessary',
    necessary: 'necessary',
    auth: 'auth'
  }

  /*
   * --------------------------------------------------------
   * Screen Operation Value
   * --------------------------------------------------------
   */
  this.currentPage = this.TOPPAGE
  this.historyOfPage = [ this.TOPPAGE ]
  this.ctrlHWModeString = 'SimpleMode'
  this.scanLineOfHistoryOfPage = 0
  this.lastHoverRole = this.UNSET_NUMBER
  this.isInvalidCurrentPage = true
  this.isFirstSetupForThisCluster = true
  this.visiblePassword = {
    rootPassword: false,
    connectionPassphrase: false,
    proxyPassword: false,
    bePassphrase: false,
    apPassphrase: false,
    vpnPassword: false
  }

  /*
   * --------------------------------------------------------
   * formDatas
   * --------------------------------------------------------
   */

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
    parent: '',

    // Also use history.
    username: '',
    password: '',
    publicKey: '',
    secretKey: '',
    authorizedKeys: '',

    timezone: '',
    ntp: {
      pools: [],
      servers: []
    },
    country: '',

    connection: {
      method: '',
      interface: {},
      wpa: {}
    },

    proxy: '',
    proxyAddress: '',
    proxyPort: '',
    noProxyAddress: '',
    proxyAuthUser: '',
    proxyAuthPassword: '',

    backend: {
      wpa: {},
      hostapd: {}
    },
    apbg: {
      wpa: {},
      hostapd: {}
    },
    apan: {
      wpa: {},
      hostapd: {}
    },

    vpnbridge: {},

    kubeadmn: {}
  }

  this.resetAllFormDatas = () => {
    // Allways changed
    this.formDatas.hostname = ''
    this.formDatas.clustername = ''
    this.formDatas.clustercomment = ''
    this.formDatas.rdboxHardWare = ''
    this.formDatas.rdboxRole = ''
    this.formDatas.hostnameSuffix = ''
    this.formDatas.parent = ''

    // Also Use History
    this.formDatas.username = ''
    this.formDatas.password = ''
    this.formDatas.publicKey = ''
    this.formDatas.secretKey = ''
    this.formDatas.authorizedKeys = ''

    this.formDatas.timezone = ''
    this.formDatas.ntp = {
      pools: [],
      servers: []
    }
    this.formDatas.country = ''

    this.formDatas.connection = {
      method: '',
      interface: {},
      wpa: {}
    }

    this.formDatas.proxy = ''
    this.formDatas.proxyAddress = ''
    this.formDatas.proxyPort = ''
    this.formDatas.noProxyAddress = ''
    this.formDatas.proxyAuthUser = ''
    this.formDatas.proxyAuthPassword = ''

    this.formDatas.backend = {
      wpa: {},
      hostapd: {}
    }
    this.formDatas.apbg = {
      wpa: {},
      hostapd: {}
    }
    this.formDatas.apan = {
      wpa: {},
      hostapd: {}
    }

    this.formDatas.vpnbridge = {}

    this.formDatas.kubeadmn = {}
  }

  this.resetAllScreenOperationValue = () => {
    try {
      this.currentPage = this.TOPPAGE
      this.historyOfPage = [ this.TOPPAGE ]
      this.scanLineOfHistoryOfPage = 0
      this.lastHoverRole = this.UNSET_NUMBER
      this.isInvalidCurrentPage = true
      this.isFirstSetupForThisCluster = false
      this.resetAllFormDatas()
    } catch (error) {
      analytics.logException(error)
    }
  }

  this.reloadFormDatas = () => {
    try {
      // UserInfo
      this.formDatas.username = this.getUsernameOfRoot()
      this.formDatas.password = this.getUserpasswdOfRoot()
      this.formDatas.publicKey = this.getPublicKeyOfRoot()
      this.formDatas.secretKey = this.getSecretKeyOfRoot()
      this.formDatas.authorizedKeys = this.getAuthorizedKeysOfRoot()

      // EnvInfo For Timezone and locale
      const prepareEnvInfo = this.predictLocaleAndTimezone()
      this.formDatas.timezone = prepareEnvInfo.timezone
      this.formDatas.locale = prepareEnvInfo.locale
      this.formDatas.ntp = this.getNtpPoolsAndServers()
      this.formDatas.country = this.getCountryCodeFromTimezone(this.formDatas.timezone)

      // NetworkInfo
      this.formDatas.connection.wpa = this.getWpaYoursiteOfWriteFiles()
      if (this.formDatas.connection.wpa.network.ssid === '') {
        this.formDatas.connection.method = 'ethernet'
      } else {
        this.formDatas.connection.method = 'wifi'
      }

      // NetworkProxy
      this.parsePageOfNetworkProxy()

      // Wi-Fi Backend and AP
      this.formDatas.backend.hostapd = this.getHostapdBeOfWriteFiles()
      this.formDatas.backend.wpa = this.getWpaBeOfWriteFiles()
      this.formDatas.apbg.hostapd = this.getHostapdApbgOfWriteFiles()
      this.formDatas.apbg.wpa = this.getWpaApbgOfWriteFiles()
      this.formDatas.apan.hostapd = this.getHostapdApanOfWriteFiles()
      this.formDatas.apan.wpa = this.getWpaApanOfWriteFiles()
      if (this.formDatas.apbg.hostapd.ssid === '') {
        this.generateRandomSSID('be')
      }
      if (this.formDatas.apbg.hostapd.ssid === '') {
        this.generateRandomSSID('ap_bg')
      }

      // VPN (Bridge)
      this.formDatas.vpnbridge = this.getVpnBridgeOfWriteFiles()

      // Kubernetes
      this.formDatas.kubeadmn = this.getKubeadmnJoinArgsOfRuncmd()
    } catch (error) {
      analytics.logException(error)
    }

    // UPD Ctrl
    this.changeCtrlTimezone()
  }

  /*
   * --------------------------------------------------------
   * userdata
   * --------------------------------------------------------
   */

  // Getter

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

  this.pushNewUserData = () => {
    this.userdata.pushNewUserData(this.currentUserData, this.formDatas.clustername, this.formDatas.clustercomment)
  }

  this.dumpYaml = () => {
    return this.userdata.dumpYaml(this.currentUserData)
  }

  this.setIsSimpleOfWriteFiles = (isSimpleFlg) => {
    this.userdata.setIsSimpleOfWriteFiles(this.currentUserData, isSimpleFlg)
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

  this.getUserpasswdOfRoot = () => {
    return this.userdata.getUserpasswdOfRoot(this.currentUserData)
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

  this.getAuthorizedKeysOfRoot = () => {
    const akeys = this.userdata.getAuthorizedKeysOfRoot(this.currentUserData)
    const akeyForTextarea = akeys.join('\n')
    return akeyForTextarea
  }

  this.getCountAuthorizedKeysOfRoot = () => {
    return this.userdata.getCountAuthorizedKeysOfRoot(this.currentUserData)
  }

  this.getNtpPoolsAndServers = () => {
    return this.userdata.getNtpPoolsAndServers(this.currentUserData)
  }

  this.getWpaYoursiteOfWriteFiles = () => {
    return this.userdata.getWpaYoursiteOfWriteFiles(this.currentUserData)
  }

  this.getWpaBeOfWriteFiles = () => {
    return this.userdata.getWpaBeOfWriteFiles(this.currentUserData)
  }

  this.getWpaApanOfWriteFiles = () => {
    return this.userdata.getWpaApanOfWriteFiles(this.currentUserData)
  }

  this.getWpaApbgOfWriteFiles = () => {
    return this.userdata.getWpaApbgOfWriteFiles(this.currentUserData)
  }

  this.getHostapdBeOfWriteFiles = () => {
    return this.userdata.getHostapdBeOfWriteFiles(this.currentUserData)
  }

  this.getHostapdApanOfWriteFiles = () => {
    return this.userdata.getHostapdApanOfWriteFiles(this.currentUserData)
  }

  this.getHostapdApbgOfWriteFiles = () => {
    return this.userdata.getHostapdApbgOfWriteFiles(this.currentUserData)
  }

  this.getHttpProxy = () => {
    return this.userdata.getHttpProxy(this.currentUserData)
  }

  this.getNoProxy = () => {
    return this.userdata.getNoProxy(this.currentUserData)
  }

  this.getVpnBridgeOfWriteFiles = () => {
    return this.userdata.getVpnBridgeOfWriteFiles(this.currentUserData)
  }

  this.getKubeadmnJoinArgsOfRuncmd = () => {
    return this.userdata.getKubeadmnJoinArgsOfRuncmd(this.currentUserData)
  }

  this.getBranchParentArray = () => {
    return this.userdata.getBranchParentArray(this.currentUserData)
  }

  this.isThisSoftwareFirstBoot = () => {
    return this.getListOfUserData().length === 0
  }

  // Setter

  this.setPasswordOfRoot = (rawPasswd) => {
    this.userdata.setPasswordOfRoot(this.currentUserData, rawPasswd)
  }

  this.setAuthorizedKeysOfRoot = (keysString) => {
    this.userdata.setAuthorizedKeysOfRoot(this.currentUserData, keysString)
  }

  this.setTimezone = (timezone) => {
    this.userdata.setTimezone(this.currentUserData, timezone)
  }

  this.setLocale = (lcCode) => {
    this.userdata.setLocale(this.currentUserData, lcCode)
  }

  this.addWpaSupplicantOfYoursiteForWriteFilesArray = (ccode, ssid, passphrase = '', options = {}) => {
    this.userdata.addWpaSupplicantOfYoursiteForWriteFilesArray(this.currentUserData, ccode, ssid, passphrase, options)
  }

  this.setProxy = (proxyFlg, proxyAddress = '', proxyPort = '',
    noProxyAddress = '', proxyAuthUser = '', proxyAuthPassword = '') => {
    const prefixHttpProxy = ''
    const prefixNoProxy = ''
    let httpProxy = ''
    let noProxy = ''

    if (proxyFlg === this.INDEX_OF_TYPE_PROXY.unnecessary) {
      httpProxy = prefixHttpProxy
      noProxy = prefixNoProxy
    } else if (proxyFlg === this.INDEX_OF_TYPE_PROXY.necessary) {
      const parser = new URL(proxyAddress)
      httpProxy = `${prefixHttpProxy}${parser.protocol}//${parser.hostname}:${proxyPort}`
      noProxy = `${prefixNoProxy}${noProxyAddress}`
      noProxy = this.validateAndFixNoProxyString(noProxy)
      noProxy = _.replace(noProxy, /\s+/g, '')
    } else if (proxyFlg === this.INDEX_OF_TYPE_PROXY.auth) {
      const parser = new URL(proxyAddress)
      httpProxy = `${prefixHttpProxy}${parser.protocol}//${proxyAuthUser}:${proxyAuthPassword}@${parser.hostname}:${proxyPort}`
      noProxy = `${prefixNoProxy}${noProxyAddress}`
      noProxy = this.validateAndFixNoProxyString(noProxy)
      noProxy = _.replace(noProxy, /\s+/g, '')
    } else {
      httpProxy = prefixHttpProxy
      noProxy = prefixNoProxy
    }
    this.setHttpProxy(httpProxy)
    this.setNoProxy(noProxy)
  }

  this.setHttpProxy = (stringOfProxy) => {
    this.userdata.setHttpProxy(this.currentUserData, stringOfProxy)
  }

  this.setNoProxy = (stringOfProxy) => {
    this.userdata.setNoProxy(this.currentUserData, stringOfProxy)
  }

  this.updateUpdateDateOfCluster = () => {
    this.userdata.updateUpdateDateOfCluster(this.currentUserData)
  }

  this.addSuffixForRoleToTheClusterData = (role, id, parent) => {
    this.userdata.addSuffixForRoleToTheClusterData(this.currentUserData, role, id, parent)
  }

  /*
   * --------------------------------------------------------
   * Utils
   * --------------------------------------------------------
   */

  this.predictLocaleAndTimezone = () => {
    try {
      let result = {
        timezone: 'UTC',
        iso6391: 'en',
        iso3166: 'US'
      }
      let iso6391 = Intl.NumberFormat().resolvedOptions().locale
      let iso3166 = ''
      const countryTZArray = []
      const tZDetailArray = []

      // Operator User Infomation.
      const nowDate = new Date()
      const tzOffset = -(nowDate.getTimezoneOffset())

      if (_.isEmpty(iso6391)) {
        return result
      }
      const localeChar = _.split(iso6391, /_|-/)
      if (localeChar.length === 1) {
        iso6391 = localeChar[0]
      } else if (localeChar.length === 2) {
        iso6391 = localeChar[0]
        iso3166 = localeChar[1]
      } else {
        return result
      }
      const usersCountryArray = _.uniqBy(_.filter(locale.all, (item) => {
        return item['iso639-1'] === iso6391 && !_.isNull(item.location)
      }), 'location')

      _.map(usersCountryArray, (item) => {
        const countryCode = country.getCode(item.location)
        const countryTZ = ct.getCountry(countryCode)
        countryTZArray.push(countryTZ)
      })

      _.map(countryTZArray, (countryItem) => {
        if (!_.isNull(countryItem)) {
          _.map(countryItem.timezones, (timezone) => {
            tZDetailArray.push(ct.getTimezone(timezone))
          })
        }
      })

      // Joint UTC & SummerTime Offset
      let mutchTzArray = _.find(tZDetailArray, { utcOffset: tzOffset })
      mutchTzArray = _.concat(mutchTzArray, _.find(tZDetailArray, { dstOffset: tzOffset }))
      _.unionBy(mutchTzArray, 'name')

      // Format
      let mutchTz = {}
      if (mutchTzArray.length) {
        mutchTz = _.head(mutchTzArray)
        if (iso3166 === '') {
          result = {
            timezone: mutchTz.name,
            ISO3166: mutchTz.country,
            ISO6391: iso6391,
            locale: `${iso6391}_${mutchTz.country}.UTF-8`
          }
        } else {
          result = {
            timezone: mutchTz.name,
            ISO3166: iso3166,
            ISO6391: iso6391,
            locale: `${iso6391}_${iso3166}.UTF-8`
          }
        }
      }
      if (!_.includes(this.getSupportLocales(), result.locale)) {
        result.locale = ''
      }
      analytics.logEvent('Predict Timezone and Locale.', {
        result,
        applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
        flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
      })
      return result
    } catch (error) {
      analytics.logException(error)
    }
  }

  this.convertToWpaPassphrase = (plainText, ssid) => {
    if (!plainText || !ssid) {
      return plainText
    }
    // eslint-disable-next-line no-magic-numbers
    const hash = crypto.pbkdf2Sync(plainText, ssid, 4096, 32, 'sha1')
    return hash.toString('hex')
  }

  this.getAllTimezones = () => {
    return ct.getAllTimezones()
  }

  this.getAllCountryCodes = () => {
    return country.getCodes()
  }

  this.getSupportLocales = () => {
    return this.SUPPORTED_LOCALES
  }

  this.getCountryCodeFromTimezone = (timezone) => {
    const timezoneReference = ct.getTimezone(timezone)
    return timezoneReference.country
  }

  this.parsePageOfNetworkProxy = () => {
    const rawHttpProxy = this.getHttpProxy()
    const rawNoProxy = this.getNoProxy()
    if (rawHttpProxy.http_proxy === '') {
      this.formDatas.proxy = this.INDEX_OF_TYPE_PROXY.unnecessary
      this.formDatas.proxyAddress = ''
      this.formDatas.noProxyAddress = rawNoProxy.no_proxy
      this.formDatas.proxyAuthUser = ''
      this.formDatas.proxyAuthPassword = ''
    } else {
      const httpURL = new URL(rawHttpProxy.http_proxy)
      if (httpURL.username === '') {
        this.formDatas.proxy = this.INDEX_OF_TYPE_PROXY.necessary
        this.formDatas.proxyAddress = `${httpURL.protocol}//${httpURL.hostname}`
        this.formDatas.proxyPort = Number(httpURL.port)
        this.formDatas.noProxyAddress = rawNoProxy.no_proxy
        this.formDatas.proxyAuthUser = ''
        this.formDatas.proxyAuthPassword = ''
      } else {
        this.formDatas.proxy = this.INDEX_OF_TYPE_PROXY.auth
        this.formDatas.proxyAddress = `${httpURL.protocol}//${httpURL.hostname}`
        this.formDatas.proxyPort = Number(httpURL.port)
        this.formDatas.noProxyAddress = rawNoProxy.no_proxy
        this.formDatas.proxyAuthUser = httpURL.username
        this.formDatas.proxyAuthPassword = httpURL.password
      }
    }
  }

  this.validateAndFixNoProxyString = (noProxyString) => {
    const splitted = _.split(noProxyString, ',')
    const regexOfAddrOrCidr = /^([0-9]{1,3}\.){3}[0-9]{1,3}(\/([0-9]|[1-2][0-9]|3[0-2]))?$/
    const result = []
    const failed = []
    _.forEach(splitted, (addrOrCidr) => {
      const trimed = _.replace(addrOrCidr, /\s+/g, '')
      if (regexOfAddrOrCidr.test(trimed)) {
        result.push(addrOrCidr)
      } else {
        failed.push(addrOrCidr)
      }
    })
    return result.join(',')
  }

  this.generateRandomString = (length) => {
    // eslint-disable-next-line max-len
    return _.map(Array.from(crypto.randomFillSync(new Uint8Array(length))), (number) => this.SEED_OF_RANDOM_CHAR[number % this.SEED_OF_RANDOM_CHAR.length]).join('')
  }

  this.generateRandomSSID = (type) => {
    if (type === 'be') {
      if (this.formDatas.apbg.hostapd.ssid !== '') {
        this.formDatas.backend.hostapd.wpa_psk = ''
        this.formDatas.backend.wpa.network.psk = ''
      }
      this.formDatas.backend.hostapd.ssid = `_${this.generateRandomString(32)}-${this.formDatas.clustername}`
      this.formDatas.backend.wpa.network.ssid = this.formDatas.backend.hostapd.ssid
    } else if (type === 'ap_bg') {
      if (this.formDatas.apbg.hostapd.ssid !== '') {
        this.formDatas.apbg.hostapd.wpa_psk = ''
        this.formDatas.apbg.wpa.network.psk = ''
        this.formDatas.apan.hostapd.wpa_psk = ''
        this.formDatas.apan.wpa.network.psk = ''
      }
      const ssidPrefix = `${this.formDatas.clustername}-${this.generateRandomString(6)}`
      this.formDatas.apbg.hostapd.ssid = `${ssidPrefix}-g`
      this.formDatas.apbg.wpa.network.ssid = this.formDatas.apbg.hostapd.ssid
      this.formDatas.apan.hostapd.ssid = `${ssidPrefix}-a`
      this.formDatas.apan.wpa.network.ssid = this.formDatas.apan.hostapd.ssid
    }
  }

  this.getIndexOfVpncmd = (cmd) => {
    // eslint-disable-next-line lodash/matches-prop-shorthand
    const idx = _.findIndex(this.formDatas.vpnbridge, (cmdBlock) => {
      return cmdBlock.vpncmd === cmd
    })
    return idx
  }

  /*
   * --------------------------------------------------------
   * ClusterData
   * --------------------------------------------------------
   */

  this.getCountPreviouslyClusterLeder = (cluster) => {
    return String(cluster.clusterData.LeaderMaster.length)
  }

  this.getCountPreviouslyClusterBranch = (cluster) => {
    return String(cluster.clusterData.BranchMaster.length)
  }

  this.getCountPreviouslyClusterSlave = (cluster) => {
    return String(cluster.clusterData.Slave.length)
  }

  this.getCountPreviouslyClusterOther = (cluster) => {
    return String(cluster.clusterData.Other.length)
  }

  this.getStringMeshModePreviouslyCluster = (cluster) => {
    let result = 'SimpleMode'
    if (cluster.clusterData.isSimple) {
      return result
    }
    result = 'FullMode'
    return result
  }

  /*
   * --------------------------------------------------------
   * User Ctrl
   * --------------------------------------------------------
   */

  /**
   * @summary save userdata and close the modal
   * @function
   * @public
   *
   * @example
   * UserdataSetterController.saveUserdataAndClose();
   */
  this.saveUserdataAndClose = () => {
    try {
      this.resetHostnameFlg()
      this.updateUpdateDateOfCluster()
      this.addSuffixForRoleToTheClusterData(this.REVERSE_RESOLUTION_ROLE[this.formDatas.rdboxRole], this.formDatas.hostnameSuffix, this.formDatas.parent)
      this.userdata.setAll(this.currentUserData)
      this.setHostnameFlg()
      selectionState.setUserdata(this.currentUserData)
    } catch (error) {
      const udError = errors.createUserError({
        title: 'Error Processing user-data',
        description: error.message
      })
      osDialog.showError(udError)
      analytics.logException(error)
    }
    analytics.logEvent('modal closed and Userdata saved (Complete))', {
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
    analytics.logEvent('Open secret selector', {
      applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
      flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
    })

    osDialog.selectSecret().then((keyFile) => {
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
        this.setFromPathOfFiles(this.currentUserData, id, this.formDatas.publicKey)
      } else if (id === 'secretKey') {
        this.formDatas.secretKey = keyFile
        this.setFromPathOfFiles(this.currentUserData, id, this.formDatas.secretKey)
      }

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
    if (this.isFirstSetupForThisCluster) {
      this.formDatas.rdboxRole = this.INDEX_OF_RDBOX_ROLE.LeaderMaster
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
    if (this.formDatas.rdboxRole === this.INDEX_OF_RDBOX_ROLE.LeaderMaster) {
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

  this.changeCtrlTimezone = () => {
    this.formDatas.country = this.getCountryCodeFromTimezone(this.formDatas.timezone)
    if (this.formDatas.connection.wpa.country === '') {
      this.formDatas.connection.wpa.country = this.formDatas.country
    }
    if (this.formDatas.backend.hostapd.country_code === '') {
      this.formDatas.backend.hostapd.country_code = this.formDatas.country
    }
    if (this.formDatas.apbg.hostapd.country_code === '') {
      this.formDatas.apbg.hostapd.country_code = this.formDatas.country
    }
    if (this.formDatas.apan.hostapd.country_code === '') {
      this.formDatas.apan.hostapd.country_code = this.formDatas.country
    }
    this.monitorRdboxForm()
  }

  this.selectPreviouslyCluster = (cluster, index) => {
    if (this.getClusterIdByIndex(index) === cluster.clusterData.id) {
      this.formDatas.clustername = cluster.clusterData.id
      this.formDatas.clustercomment = cluster.clusterData.comment
      this.setIndexOfCurrentCluster(index)
      this.ctrlHWModeString = 'SimpleMode'
      if (cluster.clusterData.isSimple) {
        return this.ctrlHWModeString
      }
      this.ctrlHWModeString = 'FullMode'
      return this.ctrlHWModeString
    }
  }

  this.addInputOfNtpPools = () => {
    this.formDatas.ntp.pools.push('')
  }

  this.delInputOfNtpPools = (index) => {
    this.formDatas.ntp.pools.splice(index, 1)
  }

  this.addInputOfNtpServers = () => {
    this.formDatas.ntp.servers.push('')
  }

  this.delInputOfNtpServers = (index) => {
    this.formDatas.ntp.servers.splice(index, 1)
  }

  this.changeInputBackendSSID = () => {
    this.formDatas.backend.wpa.network.psk = ''
    this.formDatas.backend.hostapd.wpa_psk = ''
  }

  this.changeInputAccessPointSSID = () => {
    this.formDatas.apbg.wpa.network.ssid = this.formDatas.apbg.hostapd.ssid
    this.formDatas.apan.hostapd.ssid = this.formDatas.apbg.hostapd.ssid
    this.formDatas.apbg.wpa.network.psk = ''
    this.formDatas.apbg.hostapd.wpa_psk = ''
    this.formDatas.apan.wpa.network.psk = ''
    this.formDatas.apan.hostapd.wpa_psk = ''
  }

  this.changeInputAccessPointPassphrase = () => {
    this.formDatas.apbg.wpa.network.psk = this.formDatas.apbg.hostapd.wpa_psk
    this.formDatas.apan.hostapd.wpa_psk = this.formDatas.apbg.hostapd.wpa_psk
  }

  this.changeInputAccessPointCountry = () => {
    this.formDatas.apbg.wpa.country = this.formDatas.apbg.hostapd.country_code
    this.formDatas.apan.hostapd.country_code = this.formDatas.apbg.hostapd.country_code
  }

  this.backModal = () => {
    const prevPage = _.findKey(this.INDEX_OF_PAGE, (item) => {
      return item === this.currentPage
    })
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
      this.resetAllScreenOperationValue()
      this.currentUserData = this.getUserdata()
    } else if (this.currentPage === this.INDEX_OF_PAGE.pageClusterPreviously ||
      this.currentPage === this.INDEX_OF_PAGE.pageClusterPreviously) {
      this.formDatas.rdboxHardWare = ''
    } else if (this.currentPage === this.INDEX_OF_PAGE.pageTypeHw) {
      this.formDatas.rdboxRole = ''
      if (!this.isFirstSetupForThisCluster) {
        this.lastHoverRole = this.UNSET_NUMBER
      }
    } else if (this.currentPage === this.INDEX_OF_PAGE.pageTypeRole) {
      this.formDatas.hostnameSuffix = ''
    }
    const newPage = _.findKey(this.INDEX_OF_PAGE, (item) => {
      return item === this.currentPage
    })
    const history = this.historyOfPage
    analytics.logEvent('next modal', {
      prevPage,
      newPage,
      history,
      applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
      flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
    })
    this.monitorRdboxForm()
  }

  this.nextModal = (nextPage = this.UNSET_NUMBER) => {
    const prevPage = _.findKey(this.INDEX_OF_PAGE, (item) => {
      return item === this.currentPage
    })
    if (this.currentPage === this.INDEX_OF_PAGE.pageClusterWelcom) {
      if (nextPage === this.INDEX_OF_PAGE.pageClusterNew) {
        this.isFirstSetupForThisCluster = true
      } else {
        this.isFirstSetupForThisCluster = false
      }
    }
    if (this.scanLineOfHistoryOfPage === this.HEAD_OF_SCAN) {
      if (nextPage === this.UNSET_NUMBER) {
        this.currentPage = this.getDestinationOfPage(this.currentPage)
      } else {
        this.currentPage = nextPage
        if (this.currentPage === this.INDEX_OF_PAGE.pageAllFinish) {
          this.dumpYaml()
        }
      }
    } else {
      this.scanLineOfHistoryOfPage -= 1
      // eslint-disable-next-line no-magic-numbers
      this.currentPage = this.historyOfPage[this.historyOfPage.length - this.scanLineOfHistoryOfPage - 1]
    }
    if (!_.includes(this.historyOfPage, this.currentPage)) {
      this.historyOfPage.push(this.currentPage)
    }
    const newPage = _.findKey(this.INDEX_OF_PAGE, (item) => {
      return item === this.currentPage
    })
    const history = this.historyOfPage
    analytics.logEvent('next modal', {
      prevPage,
      newPage,
      history,
      applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
      flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
    })
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
    if ($scope.pages.$invalid) {
      return true
    }
    return false
  }

  this.isSkipButtonDisabled = () => {
    return this.isInvalidCurrentPage
  }

  this.isHardwareButtonDisabled = (hw) => {
    let viaPrevious = false
    _.map(this.historyOfPage, (page) => {
      if (page === this.INDEX_OF_PAGE.pageClusterPreviously) {
        viaPrevious = true
      }
    })
    if (viaPrevious) {
      if (hw === this.INDEX_OF_RDBOX_HW.APOnly) {
        if (this.ctrlHWModeString === 'SimpleMode') {
          return false
        } else if (this.ctrlHWModeString === 'FullMode') {
          return true
        }
      } else if (hw === this.INDEX_OF_RDBOX_HW.SimpleMesh) {
        if (this.ctrlHWModeString === 'SimpleMode') {
          return false
        } else if (this.ctrlHWModeString === 'FullMode') {
          return true
        }
      } else if (hw === this.INDEX_OF_RDBOX_HW.FullMesh) {
        if (this.ctrlHWModeString === 'SimpleMode') {
          return true
        } else if (this.ctrlHWModeString === 'FullMode') {
          return false
        }
      } else {
        return false
      }
    }
    return false
  }

  this.isSelectRoleButtonDisabled = (indexOfRole) => {
    if (indexOfRole === this.INDEX_OF_RDBOX_ROLE.LeaderMaster) {
      return false
    } else if (indexOfRole === this.INDEX_OF_RDBOX_ROLE.BranchMaster) {
      if (this.formDatas.rdboxHardWare === this.INDEX_OF_RDBOX_HW.APOnly ||
          this.formDatas.rdboxHardWare === this.INDEX_OF_RDBOX_HW.SimpleMesh) {
        return false
      }
      return true
    } else if (indexOfRole === this.INDEX_OF_RDBOX_ROLE.Slave) {
      if (this.formDatas.rdboxHardWare !== this.INDEX_OF_RDBOX_HW.APOnly) {
        return false
      }
      return true
    } else if (indexOfRole === this.INDEX_OF_RDBOX_ROLE.Other) {
      return false
    } else if (indexOfRole === this.INDEX_OF_RDBOX_ROLE.VPNBridge) {
      if (this.formDatas.rdboxHardWare === this.INDEX_OF_RDBOX_HW.FullMesh) {
        return false
      }
      return true
    }
    return false
  }

  this.isBackButtonHidden = () => {
    if (this.currentPage === this.INDEX_OF_PAGE.pageClusterWelcom) {
      return true
    }
    if (this.currentPage === this.INDEX_OF_PAGE.pageAllFinish) {
      return false
    }
    return false
  }

  this.isNextButtonHidden = () => {
    if (this.currentPage === this.INDEX_OF_PAGE.pageClusterWelcom) {
      return true
    }
    if (this.currentPage === this.INDEX_OF_PAGE.pageClusterApply) {
      return true
    }
    if (this.currentPage === this.INDEX_OF_PAGE.pageAllFinish) {
      return true
    }
    return false
  }

  this.isCompleteButtonHidden = () => {
    if (this.currentPage === this.INDEX_OF_PAGE.pageClusterWelcom) {
      return true
    }
    if (this.currentPage === this.INDEX_OF_PAGE.pageAllFinish) {
      return false
    }
    return true
  }

  this.isSkipButtonHidden = () => {
    if (this.currentPage === this.INDEX_OF_PAGE.pageAllFinish) {
      return true
    }
    if (this.isFirstSetupForThisCluster) {
      return true
    }
    if (this.currentPage >= this.INDEX_OF_PAGE.pageUserdataUserinfo) {
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
      pageClusterWelcom: () => {
        return this.INDEX_OF_PAGE.pageClusterNew
      },
      pageClusterNew: () => {
        this.isFirstSetupForThisCluster = true
        this.lastHoverRole = 0
        this.pushNewUserData()
        this.reloadFormDatas()
        return this.INDEX_OF_PAGE.pageTypeHw
      },
      pageClusterPreviously: () => {
        this.isFirstSetupForThisCluster = false
        this.reloadFormDatas()
        return this.INDEX_OF_PAGE.pageTypeHw
      },
      pageTypeHw: () => {
        try {
          if (this.formDatas.rdboxHardWare === this.INDEX_OF_RDBOX_HW.APOnly ||
              this.formDatas.rdboxHardWare === this.INDEX_OF_RDBOX_HW.SimpleMesh) {
            this.setIsSimpleOfWriteFiles({
              is_simple: true
            })
          } else {
            this.setIsSimpleOfWriteFiles({
              is_simple: false
            })
          }
          if (this.isFirstSetupForThisCluster) {
            osDialog.showInfo({
              confirmationLabel: 'OK',
              title: 'A cluster must have one Leader Master.',
              description: 'INFO: When creating a cluster for the first time, Leader Master is selected.(Can be changed)'
            })
          }
        } catch (error) {
          analytics.logException(error)
        }
        return this.INDEX_OF_PAGE.pageTypeRole
      },
      pageTypeRole: () => {
        try {
          if (this.formDatas.rdboxRole === this.INDEX_OF_RDBOX_ROLE.LeaderMaster) {
            this.formDatas.hostnameSuffix = '00'
            this.formDatas.parent = '00'
            return this.INDEX_OF_PAGE.pageClusterHostname
          } else if (this.formDatas.rdboxRole === this.INDEX_OF_RDBOX_ROLE.Other) {
            return this.INDEX_OF_PAGE.pageClusterHostname
          }
        } catch (error) {
          analytics.logException(error)
        }
        return this.INDEX_OF_PAGE.pageClusterSuffix
      },
      pageClusterSuffix: () => {
        try {
          if (this.formDatas.rdboxRole === this.INDEX_OF_RDBOX_ROLE.BranchMaster) {
            this.formDatas.parent = '00'
          }
        } catch (error) {
          analytics.logException(error)
        }
        return this.INDEX_OF_PAGE.pageClusterHostname
      },
      pageClusterHostname: () => {
        try {
          this.setHostnameOfCurrentCluster(this.formDatas.hostname)
          if (this.formDatas.rdboxRole === this.INDEX_OF_RDBOX_ROLE.Other) {
            this.formDatas.hostnameSuffix = this.formDatas.hostname
          }
          if (this.isFirstSetupForThisCluster) {
            return this.INDEX_OF_PAGE.pageUserdataUserinfo
          }
        } catch (error) {
          analytics.logException(error)
        }
        return this.INDEX_OF_PAGE.pageClusterApply
      },
      pageClusterApply: () => {
        return this.INDEX_OF_PAGE.pageUserdataUserinfo
      },
      pageUserdataUserinfo: () => {
        try {
          if (!_.startsWith(this.formDatas.password, '$6$')) {
            this.setPasswordOfRoot(this.formDatas.password)
          }
          this.setAuthorizedKeysOfRoot(this.formDatas.authorizedKeys)
          if (this.getCountAuthorizedKeysOfRoot() === 0) {
            this.formDatas.authorizedKeys = ''
            return this.INDEX_OF_PAGE.pageUserdataUserinfo
          }
        } catch (error) {
          analytics.logException(error)
        }
        return this.INDEX_OF_PAGE.pageUserdataEnvinfo
      },
      pageUserdataEnvinfo: () => {
        try {
          this.setTimezone(this.formDatas.timezone)
          this.setLocale(this.formDatas.locale)
        } catch (error) {
          analytics.logException(error)
        }
        return this.INDEX_OF_PAGE.pageNetworkConnection
      },
      pageNetworkConnection: () => {
        try {
          if (this.formDatas.connection.method === 'ethernet') {
            this.formDatas.connection.wpa.network.ssid = ''
            this.formDatas.connection.wpa.network.psk = ''
          } else if (this.formDatas.connection.method === 'wifi') {
            if (this.formDatas.connection.wpa.network.psk.length !== this.WPA_PSK_LENGTH) {
              this.formDatas.connection.wpa.network.psk = this.convertToWpaPassphrase(
                this.formDatas.connection.wpa.network.psk,
                this.formDatas.connection.wpa.network.ssid)
            }
          }
        } catch (error) {
          analytics.logException(error)
        }
        return this.INDEX_OF_PAGE.pageNetworkProxy
      },
      pageNetworkProxy: () => {
        try {
          this.setProxy(this.formDatas.proxy,
            this.formDatas.proxyAddress,
            this.formDatas.proxyPort,
            this.formDatas.noProxyAddress,
            this.formDatas.proxyAuthUser,
            this.formDatas.proxyAuthPassword)
        } catch (error) {
          analytics.logException(error)
        }
        return this.INDEX_OF_PAGE.pageWifiBackend
      },
      pageWifiBackend: () => {
        try {
          if (this.formDatas.backend.hostapd.wpa_psk.length !== this.WPA_PSK_LENGTH) {
            this.formDatas.backend.hostapd.wpa_psk = this.convertToWpaPassphrase(
              this.formDatas.backend.hostapd.wpa_psk,
              this.formDatas.backend.hostapd.ssid)
            this.formDatas.backend.wpa.network.psk = this.formDatas.backend.hostapd.wpa_psk
          }
        } catch (error) {
          analytics.logException(error)
        }
        return this.INDEX_OF_PAGE.pageWifiApbg
      },
      pageWifiApbg: () => {
        try {
          if (this.formDatas.apbg.hostapd.ssid === this.formDatas.apan.hostapd.ssid) {
            const beforeData = this.formDatas.apbg.hostapd.ssid
            this.formDatas.apan.hostapd.ssid = `${beforeData}-a`
          }
          if (this.formDatas.apbg.hostapd.wpa_psk.length !== this.WPA_PSK_LENGTH) {
            this.formDatas.apbg.hostapd.wpa_psk = this.convertToWpaPassphrase(
              this.formDatas.apbg.hostapd.wpa_psk,
              this.formDatas.apbg.hostapd.ssid)
            this.formDatas.apbg.wpa.network.psk = this.formDatas.apbg.hostapd.wpa_psk
          }
          if (this.formDatas.rdboxHardWare === this.INDEX_OF_RDBOX_HW.APOnly ||
              this.formDatas.rdboxHardWare === this.INDEX_OF_RDBOX_HW.SimpleMesh) {
            return this.INDEX_OF_PAGE.pageVpnBridge
          }
        } catch (error) {
          analytics.logException(error)
        }
        return this.INDEX_OF_PAGE.pageWifiApan
      },
      pageWifiApan: () => {
        try {
          if (this.formDatas.apan.hostapd.wpa_psk.length !== this.WPA_PSK_LENGTH) {
            this.formDatas.apan.hostapd.wpa_psk = this.convertToWpaPassphrase(
              this.formDatas.apan.hostapd.wpa_psk,
              this.formDatas.apan.hostapd.ssid)
            this.formDatas.apan.wpa.network.psk = this.formDatas.apan.hostapd.wpa_psk
          }
        } catch (error) {
          analytics.logException(error)
        }
        return this.INDEX_OF_PAGE.pageVpnBridge
      },
      pageVpnBridge: () => {
        return this.INDEX_OF_PAGE.pageJoinKubernetes
      },
      pageJoinKubernetes: () => {
        try {
          this.dumpYaml()
        } catch (error) {
          analytics.logException(error)
        }
        return this.INDEX_OF_PAGE.pageAllFinish
      },
      pageAllFinish: () => {
        return this.INDEX_OF_PAGE.pageAllFinish
      }
    }
    const pageName = this.getKeyFromValue(this.INDEX_OF_PAGE, index)
    this.monitorRdboxForm()
    if (this.isInvalidCurrentPage) {
      return this.currentPage
    }
    const pageNo = pager[pageName]()
    return pageNo
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