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
const yaml = require('js-yaml')

const PATH_ETC_RDBOX = '/etc/rdbox'
const CLOUDINIT_HEDER_CLOUDINIT = '#cloud-config'
const CLOUDINIT_HEDER_VIMMER = '# vim: syntax=yaml'
const WPA_SUPPLICANT_QUARTO = [
  'ssid'
]

const UD_WRITE_FILE = {
  path: '',
  content: '',
  type: '',
  type_content: {}
}

const UD_TYPE_CONTENT_IS_SIMPLE = {
  is_simple: true
}

const UD_TYPE_CONTENT_WPA_SUPPLICANT = {
  ctrl_interface: '',
  update_config: 1,
  country: '',
  network: {
    ssid: '',
    psk: '',
    scan_ssid: 1,
    bssid: '',
    bssid_blacklist: ''
  }
}

const UD_TYPE_CONTENT_HOSTAPD = {
  ssid: '',
  wpa_passphrase: '',
  country_code: '',
  interface: '',
  ctrl_interface: '',
  deny_mac_file: '',
  driver: 'nl80211',
  ctrl_interface_group: 0,
  wpa: 2,
  wpa_key_mgmt: 'WPA-PSK',
  rsn_pairwise: 'CCMP',
  logger_syslog: 1,
  logger_syslog_level: 1,
  logger_stdout: -1,
  logger_stdout_level: 1,
  hw_mode: 'a',
  ieee80211n: 1,
  require_ht: 1,
  channel: 1,
  ht_capab: '[HT40-][HT40+][SHORT-GI-40][TX-STBC][RX-STBC12][GF]',
  wmm_enabled: 1,
  wmm_ac_bk_cwmin: 4,
  wmm_ac_bk_cwmax: 10,
  wmm_ac_bk_aifs: 7,
  wmm_ac_bk_txop_limit: 0,
  wmm_ac_bk_acm: 0,
  wmm_ac_be_aifs: 3,
  wmm_ac_be_cwmin: 4,
  wmm_ac_be_cwmax: 10,
  wmm_ac_be_txop_limit: 0,
  wmm_ac_be_acm: 0,
  wmm_ac_vi_aifs: 2,
  wmm_ac_vi_cwmin: 3,
  wmm_ac_vi_cwmax: 4,
  wmm_ac_vi_txop_limit: 94,
  wmm_ac_vi_acm: 0,
  wmm_ac_vo_aifs: 2,
  wmm_ac_vo_cwmin: 2,
  wmm_ac_vo_cwmax: 3,
  wmm_ac_vo_txop_limit: 47,
  wme_enabled: 1,
  macaddr_acl: 0
}

const UD_TYPE_CONTENT_VPNBRIDGE = {
  DEVICE: 'eth0',
  CascadeCreate: {
    key: 'cascade_rdbox',
    SERVER: '',
    PORT: 443,
    HUB: '',
    USERNAME: ''
  },
  CascadePasswordSet: {
    key: 'cascade_rdbox',
    PASSWORD: '',
    TYPE: 'standard'
  },
  CascadeOnline: {
    key: 'cascade_rdbox'
  },
  CascadeList: {}
}

const UD_TYPE_CONTENT_HTTP_PROXY = {
  http_proxy: ''
}

const UD_TYPE_CONTENT_NO_PROXY = {
  no_proxy: ''
}

const UD_RUNCMD = {
  id: '',
  path: '',
  args: ''
}

const UD_FILES = {
  id: '',
  from_path: '',
  to_path: ''
}

const UD_CLOUD_INIT = {
  hostname: '',
  fqdn: 'rdbox.lan',
  manage_etc_hosts: true,
  resize_rootfs: true,
  growpart: {
    mode: 'auto',
    devices: [ '/' ],
    ignore_growroot_disabled: false
  },
  users: [
    {
      name: 'ubuntu',
      gecos: 'RDBOX-Administrator',
      sudo: 'ALL=(ALL) NOPASSWD:ALL',
      shell: '/bin/bash',
      groups: 'users,docker,video,input',
      lock_passwd: true,
      passwd: '',
      ssh_authorized_keys: []
    }
  ],
  ssh_pwauth: false,
  locale: '',
  timezone: '',
  ntp: {
    pools: [],
    servers: []
  }
}

const UD_CLUSTER_DATA = {
  id: '',
  isSimple: true,
  master00: false,
  masterBase: [],
  slave: [],
  bridge: [],
  comment: ''
}

const UD_INFO = {
  version: 1,
  createDate: '',
  updateDate: '',
  comment: ''
}

const UD_USER_DATA = {
  hostname: '',
  info: UD_INFO,
  clusterData: UD_CLUSTER_DATA,
  cloudInit: UD_CLOUD_INIT,
  rdbox: {
    write_files: [],
    runcmd: [],
    files: []
  }
}

const BASE_USERDATAS = {
  currentRawText: '',
  currentFiles: [],
  currentCluster: 0,
  info: {},
  userDatas: []
}

exports.constructSimpleModeFlg = () => {
  // eslint-disable-next-line prefer-const
  let base = _.cloneDeep(UD_WRITE_FILE)
  base.path = '/var/lib/rdbox/.is_simple'
  base.type = 'is_simple'
  base.type_content = _.cloneDeep(UD_TYPE_CONTENT_IS_SIMPLE)
  return base
}

exports.constructNetRules = () => {
  // eslint-disable-next-line prefer-const
  let base = _.cloneDeep(UD_WRITE_FILE)
  base.path = '/etc/udev/rules.d/70-persistent-net.rules'
  base.type = 'net_rules'
  base.type_content = [
    // eslint-disable-next-line max-len
    'SUBSYSTEM=="net", ACTION=="add", DRIVERS=="?*", ATTR{address}=="b8:27:eb:??:??:??", ATTR{dev_id}=="0x0", ATTR{type}=="1", KERNEL=="eth*", NAME="eth0"',
    // eslint-disable-next-line max-len
    'SUBSYSTEM=="net", ACTION=="add", DRIVERS=="?*", ATTR{address}=="b8:27:eb:??:??:??", ATTR{dev_id}=="0x0", ATTR{type}=="1", KERNEL=="wlan*", NAME="wlan10"'
  ]
  return base
}

exports.constructWpaSupplicant = (type) => {
  // eslint-disable-next-line prefer-const
  let base = _.cloneDeep(UD_WRITE_FILE)
  base.path = `${PATH_ETC_RDBOX}/wpa_supplicant_${type}.conf`
  base.type = 'wpa_supplicant'
  base.type_content = _.cloneDeep(UD_TYPE_CONTENT_WPA_SUPPLICANT)
  base.type_content.ctrl_interface = `DIR=/var/run/wpa_supplicant_${type} GROUP=netdev`
  return base
}

exports.constructHostapd = (type) => {
  // eslint-disable-next-line prefer-const
  let base = _.cloneDeep(UD_WRITE_FILE)
  base.path = `${PATH_ETC_RDBOX}/hostapd_${type}.conf`
  base.type = 'hostapd'
  base.type_content = _.cloneDeep(UD_TYPE_CONTENT_HOSTAPD)
  base.type_content.ctrl_interface = `/var/run/hostapd_${type}`
  base.type_content.deny_mac_file = '/etc/rdbox/hostapd_be.deny'
  if (type === 'be') {
    base.type_content.interface = 'wlan1'
  } else if (type === 'ap_an') {
    base.type_content.interface = 'wlan2'
  } else if (type === 'ap_bg') {
    base.type_content.interface = 'wlan3'
  } else {
    base.type_content.interface = 'wlan10'
  }
  return base
}

exports.constructVPNBridge = () => {
  // eslint-disable-next-line prefer-const
  let base = _.cloneDeep(UD_WRITE_FILE)
  base.path = '/usr/local/etc/vpnbridge.in'
  base.type = 'vpnbridge'
  base.type_content = _.cloneDeep(UD_TYPE_CONTENT_VPNBRIDGE)
  return base
}

exports.constructHttpProxy = () => {
  // eslint-disable-next-line prefer-const
  let base = _.cloneDeep(UD_WRITE_FILE)
  base.path = '/etc/transproxy/http_proxy'
  base.type = 'http_proxy'
  base.type_content = _.cloneDeep(UD_TYPE_CONTENT_HTTP_PROXY)
  return base
}

exports.constructNoProxy = () => {
  // eslint-disable-next-line prefer-const
  let base = _.cloneDeep(UD_WRITE_FILE)
  base.path = '/etc/transproxy/no_proxy'
  base.type = 'no_proxy'
  base.type_content = _.cloneDeep(UD_TYPE_CONTENT_NO_PROXY)
  return base
}

exports.constructRuncmd = (path, id) => {
  // eslint-disable-next-line prefer-const
  let base = _.cloneDeep(UD_RUNCMD)
  base.id = id
  base.path = path
  base.args = ''
  return base
}

exports.constructFiles = (id) => {
  // eslint-disable-next-line prefer-const
  let base = _.cloneDeep(UD_FILES)
  base.id = id
  return base
}

exports.constructUserdatas = () => {
  // eslint-disable-next-line prefer-const
  let base = _.cloneDeep(UD_USER_DATA)

  // Add net.rules
  base.rdbox.write_files.push(this.constructNetRules())
  console.log(base)

  // Add simple mode flag file.
  base.rdbox.write_files.push(this.constructSimpleModeFlg())

  // Add wpa_supplicant
  base.rdbox.write_files.push(this.constructWpaSupplicant('be'))
  base.rdbox.write_files.push(this.constructWpaSupplicant('ap_an'))
  base.rdbox.write_files.push(this.constructWpaSupplicant('ap_bg'))
  base.rdbox.write_files.push(this.constructWpaSupplicant('yoursite'))

  // Add hostapd
  base.rdbox.write_files.push(this.constructHostapd('be'))
  base.rdbox.write_files.push(this.constructHostapd('ap_an'))
  base.rdbox.write_files.push(this.constructHostapd('ap_bg'))

  // Add VPNBridge
  base.rdbox.write_files.push(this.constructVPNBridge())

  // Add HTTP Proxy
  base.rdbox.write_files.push(this.constructHttpProxy())

  // Add No Proxy
  base.rdbox.write_files.push(this.constructNoProxy())

  // Add runcmd
  base.rdbox.runcmd.push(this.constructRuncmd(
    '/opt/rdbox/boot/rdbox-first_session.bash',
    'rdbox_first_session'))
  base.rdbox.runcmd.push(this.constructRuncmd(
    '/opt/rdbox/boot/to_run_kubeadm_join_after_communicating_with',
    'to_run_kubeadm_join_after_communicating_with'))

  // Add files
  base.rdbox.files.push(this.constructFiles('publicKey'))
  base.rdbox.files.push(this.constructFiles('secretKey'))

  return base
}

exports.constructDefault = () => {
  // eslint-disable-next-line prefer-const
  let base = _.cloneDeep(BASE_USERDATAS)
  base.info = _.cloneDeep(UD_INFO)
  base.userDatas.push(this.constructUserdatas())
  return base
}

let DEFAULT_USERDATAS = this.constructDefault()

exports.getDefaultUserdatas = () => {
  if (typeof DEFAULT_USERDATAS === 'undefined') {
    DEFAULT_USERDATAS = this.constructDefault()
  }
  return DEFAULT_USERDATAS
}

exports.setFromPathOfFiles = (userdatas, id, fromPath) => {
  userdatas
    .userDatas[userdatas.currentCluster]
    .rdbox
    .files[this.getIndexOfFiles(userdatas, id)]
    .from_path = fromPath
}

exports.getIndexOfFiles = (userdatas, filesId) => {
  // eslint-disable-next-line lodash/matches-prop-shorthand
  const idx = _.findIndex(userdatas.userDatas[userdatas.currentCluster].rdbox.files, (file) => {
    return file.id === filesId
  })
  return idx
}

exports.getCurrentHostname = (userdatas) => {
  return userdatas.userDatas[userdatas.currentCluster].hostname
}

exports.setHostnameFlg = (userdatas) => {
  userdatas.userDatas[userdatas.currentCluster].hostname =
  userdatas.userDatas[userdatas.currentCluster].cloudInit.hostname
}

exports.resetHostnameFlg = (userdatas) => {
  userdatas.userDatas[userdatas.currentCluster].hostname = ''
}

const evalWriteFile = {
  is_simple: (writeFileItem) => {
    writeFileItem.content = `${String(writeFileItem.type_content.is_simple)}\n`
    return writeFileItem
  },
  wpa_supplicant: (writeFileItem) => {
    let raw = ''
    _.forEach(writeFileItem.type_content, (value, key) => {
      if (key === 'network') {
        const objLength = _.keys(value).length
        let objCounter = 0
        raw = `${raw}network={\n`
        _.forEach(value, (childValue, childKey) => {
          // eslint-disable-next-line no-magic-numbers
          objCounter += 1
          if (objCounter === objLength) {
            if (childValue === '') {
              raw = `${raw}#${childKey}\n`
            } else if (_.includes(WPA_SUPPLICANT_QUARTO, childKey)) {
              raw = `${raw}  ${childKey}="${childValue}"\n`
            } else {
              raw = `${raw}  ${childKey}=${childValue}\n`
            }
            raw = `${raw}}\n`
          } else if (childValue === '') {
            raw = `${raw}#${childKey}\n`
          } else if (_.includes(WPA_SUPPLICANT_QUARTO, childKey)) {
            raw = `${raw}  ${childKey}="${childValue}"\n`
          } else {
            raw = `${raw}  ${childKey}=${childValue}\n`
          }
        })
      } else if (value === '') {
        raw = `${raw}#${key}\n`
      } else {
        raw = `${raw}${key}=${value}\n`
      }
    })
    writeFileItem.content = raw
    return writeFileItem
  },
  hostapd: (writeFileItem) => {
    let raw = ''
    _.forEach(writeFileItem.type_content, (value, key) => {
      if (value === '') {
        raw = `${raw}#${key}=\n`
      } else {
        raw = `${raw}${key}=${value}\n`
      }
    })
    writeFileItem.content = raw
    return writeFileItem
  },
  vpnbridge: (writeFileItem) => {
    let raw = ''
    raw = `${raw}BridgeCreate BRIDGE /DEVICE:${writeFileItem.type_content.DEVICE}\n`
    raw = `${raw}Hub BRIDGE\n`
    // eslint-disable-next-line max-len
    raw = `${raw}CascadeCreate ${writeFileItem.type_content.CascadeCreate.key} /SERVER:${writeFileItem.type_content.CascadeCreate.SERVER}:${writeFileItem.type_content.CascadeCreate.PORT} /HUB:${writeFileItem.type_content.CascadeCreate.HUB} /USERNAME:${writeFileItem.type_content.CascadeCreate.USERNAME}\n`
    // eslint-disable-next-line max-len
    raw = `${raw}CascadePasswordSet ${writeFileItem.type_content.CascadePasswordSet.key} /PASSWORD:${writeFileItem.type_content.CascadePasswordSet.PASSWORD} /TYPE:${writeFileItem.type_content.CascadePasswordSet.TYPE}\n`
    raw = `${raw}CascadeOnline ${writeFileItem.type_content.CascadeOnline.key}\n`
    raw = `${raw}CascadeList\n`
    writeFileItem.content = raw
    return writeFileItem
  },
  http_proxy: (writeFileItem) => {
    writeFileItem.content = `http_proxy=${String(writeFileItem.type_content.http_proxy)}\n`
    return writeFileItem
  },
  no_proxy: (writeFileItem) => {
    writeFileItem.content = `no_proxy=${String(writeFileItem.type_content.no_proxy)}\n`
    return writeFileItem
  },
  net_rules: (writeFileItem) => {
    let raw = ''
    _.forEach(writeFileItem.type_content, (nic) => {
      raw = `${raw}${nic}\n`
    })
    writeFileItem.content = raw
    return writeFileItem
  }
}

const evalRuncmd = {
  rdbox_first_session: (runcmdItem) => {
    return `${runcmdItem.path} ${runcmdItem.args}`
  },
  to_run_kubeadm_join_after_communicating_with: (runcmdItem) => {
    return `${runcmdItem.path} ${runcmdItem.args}`
  }
}

exports.dumpYamlFromCloudInit = (userdatas) => {
  const raw = yaml.safeDump(userdatas.userDatas[userdatas.currentCluster].cloudInit)
  return raw
}

exports.dumpYamlFromWriteFileList = (userdatas) => {
  const writeFiles = {
    write_files: []
  }
  _.forEach(userdatas.userDatas[userdatas.currentCluster].rdbox.write_files, (writeFileItem) => {
    const item = _.pick(evalWriteFile[writeFileItem.type](writeFileItem), _.keys({ content: null, path: null }))
    writeFiles.write_files.push(item)
  })
  const raw = yaml.safeDump(writeFiles, { lineWidth: 400 })
  return raw
}

exports.dumpYamlFromRuncmdList = (userdatas) => {
  const runcmds = {
    runcmd: []
  }
  _.forEach(userdatas.userDatas[userdatas.currentCluster].rdbox.runcmd, (runcmdItem) => {
    const item = evalRuncmd[runcmdItem.id](runcmdItem)
    runcmds.runcmd.push(item)
  })
  const raw = yaml.safeDump(runcmds, { lineWidth: 400 })
  return raw
}

exports.dumpYaml = (userdatas) => {
  let raw = ''
  raw = `${CLOUDINIT_HEDER_CLOUDINIT}\n`
  raw = `${raw}${CLOUDINIT_HEDER_VIMMER}\n`
  raw = `${raw}\n`
  raw = `${raw}${this.dumpYamlFromCloudInit(userdatas)}\n`
  raw = `${raw}\n`
  raw = `${raw}${this.dumpYamlFromWriteFileList(userdatas)}\n`
  raw = `${raw}\n`
  raw = `${raw}${this.dumpYamlFromRuncmdList(userdatas)}\n`
  userdatas.currentRawText = raw
  _.merge(userdatas.currentFiles, userdatas.userDatas[userdatas.currentCluster].rdbox.files)
  return raw
}