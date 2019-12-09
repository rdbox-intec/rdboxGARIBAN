/* eslint-disable prefer-template */
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
const sha512crypt = require('sha512crypt-node')

const PATH_ETC_RDBOX = '/etc/rdbox'
const CLOUDINIT_HEDER_CLOUDINIT = '#cloud-config'
const CLOUDINIT_HEDER_VIMMER = '# vim: syntax=yaml'
const WPA_SUPPLICANT_QUARTO = [
  'ssid'
]

const UD_WRITE_FILE = {
  id: '',
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
  wpa_psk: '',
  country_code: '',
  channel: 36,
  hw_mode: 'a',
  interface: '',
  ctrl_interface: '',
  deny_mac_file: '',
  driver: 'nl80211',
  ctrl_interface_group: 0,
  bridge: '',
  wpa: 2,
  wpa_key_mgmt: 'WPA-PSK',
  rsn_pairwise: 'CCMP',
  logger_syslog: 1,
  logger_syslog_level: 1,
  logger_stdout: -1,
  logger_stdout_level: 1,
  ieee80211n: 1,
  require_ht: 1,
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

const UD_TYPE_CONTENT_VPNBRIDGE = [
  {
    vpncmd: 'BridgeCreate',
    hubname: 'BRIDGE',
    device_name: 'eth0'
  },
  {
    vpncmd: 'Hub',
    name: 'BRIDGE'
  },
  {
    vpncmd: 'CascadeCreate',
    name: 'cascade_rdbox',
    hostname: '',
    port: 443,
    hubname: '',
    username: ''
  },
  {
    vpncmd: 'CascadePasswordSet',
    name: 'cascade_rdbox',
    password: '',
    type: 'standard'
  },
  {
    vpncmd: 'CascadeOnline',
    name: 'cascade_rdbox'
  },
  {
    vpncmd: 'CascadeList'
  }
]

const UD_TYPE_CONTENT_HTTP_PROXY = {
  http_proxy: ''
}

const UD_TYPE_CONTENT_NO_PROXY = {
  no_proxy: '127.0.0.1,192.168.179.0/24'
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
    pools: [
      '0.debian.pool.ntp.org',
      '1.debian.pool.ntp.org'
    ],
    servers: [
      'ntp.ubuntu.com'
    ]
  }
}

const UD_CLUSTER_DATA = {
  id: '',
  isSimple: true,
  LeaderMaster: [],
  BranchMaster: [],
  Slave: [],
  Other: [],
  VPNBridge: [],
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

exports.vpncmdBuilder = (cmd) => {
  // eslint-disable-next-line require-jsdoc
  const expandMaps = (strings, ...values) => {
    let raw = ''
    const maps = _.last(values)
    // eslint-disable-next-line no-magic-numbers
    const lastIndex = values.length - 1
    _.forEach(values, (val, idx, attr) => {
      if (idx < lastIndex) {
        raw = raw + strings[idx] + maps[val]
      }
    })
    return raw
  }
  let result = ''
  switch (cmd.vpncmd) {
    case 'BridgeCreate':
      result = expandMaps `BridgeCreate ${'hubname'} /DEVICE:${'device_name'}${cmd}`
      break
    case 'Hub':
      result = expandMaps `Hub ${'name'}${cmd}`
      break
    case 'CascadeCreate':
      result = expandMaps `CascadeCreate ${'name'} /SERVER:${'hostname'}:${'port'} /HUB:${'hubname'} /USERNAME:${'username'}${cmd}`
      break
    case 'CascadePasswordSet':
      result = expandMaps `CascadePasswordSet ${'name'} /PASSWORD:${'password'} /TYPE:${'type'}${cmd}`
      break
    case 'CascadeOnline':
      result = expandMaps `CascadeOnline ${'name'}${cmd}`
      break
    case 'CascadeList':
      result = 'CascadeList'
      break
    default:
      break
  }
  return result
}

exports.constructSimpleModeFlg = () => {
  // eslint-disable-next-line prefer-const
  let base = _.cloneDeep(UD_WRITE_FILE)
  base.path = '/var/lib/rdbox/.is_simple'
  base.type = 'is_simple'
  base.id = base.type
  base.type_content = _.cloneDeep(UD_TYPE_CONTENT_IS_SIMPLE)
  return base
}

exports.constructNetRules = () => {
  // eslint-disable-next-line prefer-const
  let base = _.cloneDeep(UD_WRITE_FILE)
  base.path = '/etc/udev/rules.d/70-persistent-net.rules'
  base.type = 'net_rules'
  base.id = base.type
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
  base.id = `${base.type}_${type}`
  base.type_content = _.cloneDeep(UD_TYPE_CONTENT_WPA_SUPPLICANT)
  base.type_content.ctrl_interface = `DIR=/var/run/wpa_supplicant_${type} GROUP=netdev`
  return base
}

exports.constructHostapd = (type) => {
  // eslint-disable-next-line prefer-const
  let base = _.cloneDeep(UD_WRITE_FILE)
  base.path = `${PATH_ETC_RDBOX}/hostapd_${type}.conf`
  base.type = 'hostapd'
  base.id = `${base.type}_${type}`
  base.type_content = _.cloneDeep(UD_TYPE_CONTENT_HOSTAPD)
  base.type_content.ctrl_interface = `/var/run/hostapd_${type}`
  base.type_content.deny_mac_file = '/etc/rdbox/hostapd_be.deny'
  if (type === 'be') {
    base.type_content.interface = 'wlan1'
    base.type_content.hw_mode = 'a'
    base.type_content.channel = 36
  } else if (type === 'ap_an') {
    base.type_content.interface = 'wlan2'
    base.type_content.hw_mode = 'a'
    base.type_content.channel = 36
    base.type_content.bridge = 'br0'
  } else if (type === 'ap_bg') {
    base.type_content.interface = 'wlan3'
    base.type_content.hw_mode = 'g'
    base.type_content.channel = 1
    base.type_content.bridge = 'br0'
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
  base.id = base.type
  base.type_content = _.cloneDeep(UD_TYPE_CONTENT_VPNBRIDGE)
  return base
}

exports.constructHttpProxy = () => {
  // eslint-disable-next-line prefer-const
  let base = _.cloneDeep(UD_WRITE_FILE)
  base.path = '/etc/transproxy/http_proxy'
  base.type = 'http_proxy'
  base.id = base.type
  base.type_content = _.cloneDeep(UD_TYPE_CONTENT_HTTP_PROXY)
  return base
}

exports.constructNoProxy = () => {
  // eslint-disable-next-line prefer-const
  let base = _.cloneDeep(UD_WRITE_FILE)
  base.path = '/etc/transproxy/no_proxy'
  base.type = 'no_proxy'
  base.id = base.type
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
  return base
}

let DEFAULT_USERDATAS = this.constructDefault()

exports.constructISO8601 = () => {
  const date = new Date()

  // eslint-disable-next-line require-jsdoc
  const addZero = (time) => {
    return ('0' + time).slice(-2)
  }

  const ISO8601Date = date.getFullYear() + '-' +
                      addZero(date.getMonth() + 1) + '-' +
                      addZero(date.getDate()) +
                      'T' +
                      addZero(date.getHours()) + ':' +
                      addZero(date.getMinutes()) + ':' +
                      addZero(date.getSeconds()) + '+' +
                      addZero(date.getTimezoneOffset() / (-60)) + ':00'
  return ISO8601Date
}

exports.generateSalt = (saltLength) => {
  const charSeeds = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const charSeedsLength = charSeeds.length
  let result = ''
  // eslint-disable-next-line no-magic-numbers
  for (let idx = 0; idx < saltLength; idx += 1) {
    result += charSeeds[Math.floor(Math.random() * charSeedsLength)]
  }
  return result
}

exports.getDefaultUserdatas = () => {
  if (typeof DEFAULT_USERDATAS === 'undefined') {
    DEFAULT_USERDATAS = this.constructDefault()
  }
  return DEFAULT_USERDATAS
}

exports.pushNewUserData = (referrer, id, comment) => {
  const userdatasLength = referrer.userDatas.push(this.constructUserdatas())
  const userdatasIndex = userdatasLength - 1
  referrer.userDatas[userdatasIndex].clusterData.id = id
  referrer.userDatas[userdatasIndex].clusterData.comment = comment
  const ISO8601Date = this.constructISO8601()
  referrer.userDatas[userdatasIndex].info.createDate = ISO8601Date
  referrer.userDatas[userdatasIndex].info.updateDate = ISO8601Date
  referrer.currentCluster = userdatasIndex
}

exports.setFromPathOfFiles = (referrer, id, fromPath) => {
  referrer
    .userDatas[referrer.currentCluster]
    .rdbox
    .files[this.getIndexOfFiles(referrer, id)]
    .from_path = fromPath
}

exports.getIndexOfFiles = (referrer, filesId) => {
  // eslint-disable-next-line lodash/matches-prop-shorthand
  const idx = _.findIndex(referrer.userDatas[referrer.currentCluster].rdbox.files, (file) => {
    return file.id === filesId
  })
  return idx
}

exports.getIndexOfWriteFs = (referrer, filesId) => {
  // eslint-disable-next-line lodash/matches-prop-shorthand
  const idx = _.findIndex(referrer.userDatas[referrer.currentCluster].rdbox.write_files, (writeFile) => {
    return writeFile.id === filesId
  })
  return idx
}

exports.getIndexOfRuncmd = (referrer, filesId) => {
  // eslint-disable-next-line lodash/matches-prop-shorthand
  const idx = _.findIndex(referrer.userDatas[referrer.currentCluster].rdbox.runcmd, (cmd) => {
    return cmd.id === filesId
  })
  return idx
}

exports.getCurrentHostname = (referrer) => {
  return referrer.userDatas[referrer.currentCluster].hostname
}

const evalWriteFile = {
  is_simple: (writeFileItem) => {
    writeFileItem.content = `${String(writeFileItem.type_content.is_simple)}\n`
    return writeFileItem
  },
  wpa_supplicant: (writeFileItem) => {
    let raw = ''
    if (writeFileItem.id === 'wpa_supplicant_yoursite' &&
        writeFileItem.type_content.network.ssid === '') {
      writeFileItem.content = ''
      return writeFileItem
    }
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
    const vpncmds = writeFileItem.type_content
    const rawcmds = []
    _.map(vpncmds, (cmd) => {
      rawcmds.push(this.vpncmdBuilder(cmd))
    })
    writeFileItem.content = rawcmds.join('\n')
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

exports.dumpYamlFromCloudInit = (referrer) => {
  const raw = yaml.safeDump(referrer.userDatas[referrer.currentCluster].cloudInit, { lineWidth: 800 })
  return raw
}

exports.dumpYamlFromWriteFileList = (referrer) => {
  const writeFiles = {
    write_files: []
  }
  _.forEach(referrer.userDatas[referrer.currentCluster].rdbox.write_files, (writeFileItem) => {
    const item = _.pick(evalWriteFile[writeFileItem.type](writeFileItem), _.keys({ content: null, path: null }))
    if (item.content !== '') {
      if (referrer.userDatas[referrer.currentCluster].clusterData.isSimple) {
        if (writeFileItem.id === 'wpa_supplicant_ap_an' || writeFileItem.id === 'hostapd_ap_an') {
          console.log(writeFileItem.id)
        } else {
          writeFiles.write_files.push(item)
        }
      } else {
        writeFiles.write_files.push(item)
      }
    }
  })
  const raw = yaml.safeDump(writeFiles, { lineWidth: 800 })
  return raw
}

exports.dumpYamlFromRuncmdList = (referrer) => {
  const runcmds = {
    runcmd: []
  }
  _.forEach(referrer.userDatas[referrer.currentCluster].rdbox.runcmd, (runcmdItem) => {
    const item = evalRuncmd[runcmdItem.id](runcmdItem)
    runcmds.runcmd.push(item)
  })
  const raw = yaml.safeDump(runcmds, { lineWidth: 800 })
  return raw
}

exports.dumpYaml = (referrer) => {
  let raw = ''
  raw = `${CLOUDINIT_HEDER_CLOUDINIT}\n`
  raw = `${raw}${CLOUDINIT_HEDER_VIMMER}\n`
  raw = `${raw}\n`
  raw = `${raw}${this.dumpYamlFromCloudInit(referrer)}\n`
  raw = `${raw}\n`
  raw = `${raw}${this.dumpYamlFromWriteFileList(referrer)}\n`
  raw = `${raw}\n`
  raw = `${raw}${this.dumpYamlFromRuncmdList(referrer)}\n`
  referrer.currentRawText = raw
  _.merge(referrer.currentFiles, referrer.userDatas[referrer.currentCluster].rdbox.files)
  return raw
}

exports.setRdboxWriteFilesByFilesId = (referrer, filesId, item) => {
  referrer.userDatas[referrer.currentCluster].rdbox.write_files[this.getIndexOfWriteFs(referrer, filesId)].type_content = item
}

exports.setIsSimpleOfWriteFiles = (referrer, item) => {
  this.setRdboxWriteFilesByFilesId(referrer, 'is_simple', item)
  referrer.userDatas[referrer.currentCluster].clusterData.isSimple = item.is_simple
}

exports.resetHostnameFlg = (referrer) => {
  referrer.userDatas[referrer.currentCluster].hostname = ''
}

exports.setHostnameFlg = (referrer) => {
  referrer.userDatas[referrer.currentCluster].hostname =
  referrer.userDatas[referrer.currentCluster].cloudInit.hostname
}

exports.setHostnameOfCurrentCluster = (referrer, hostname) => {
  referrer.userDatas[referrer.currentCluster].cloudInit.hostname = hostname
}

exports.setIndexOfCurrentCluster = (referrer, indexNo) => {
  referrer.currentCluster = indexNo
}

exports.setPasswordOfRoot = (referrer, rawPasswd) => {
  // eslint-disable-next-line no-magic-numbers
  const salt = this.generateSalt(15)
  const passwd = sha512crypt.b64_sha512crypt(rawPasswd, salt)
  // eslint-disable-next-line no-magic-numbers
  referrer.userDatas[referrer.currentCluster].cloudInit.users[0].passwd = _.replace(passwd, /\r?\n/g, '')
}

exports.setAuthorizedKeysOfRoot = (referrer, keysString) => {
  // eslint-disable-next-line no-magic-numbers
  referrer.userDatas[referrer.currentCluster].cloudInit.users[0].ssh_authorized_keys = []
  const keysArray = _.split(keysString, /\r\n|\n/)
  _.map(keysArray, (authKey) => {
    // eslint-disable-next-line no-magic-numbers
    if (authKey.match(/^ssh-rsa/) && !_.includes(referrer.userDatas[referrer.currentCluster].cloudInit.users[0].ssh_authorized_keys, authKey)) {
      // eslint-disable-next-line no-magic-numbers
      referrer.userDatas[referrer.currentCluster].cloudInit.users[0].ssh_authorized_keys.push(authKey)
    }
  })
}

exports.setTimezone = (referrer, timezone) => {
  referrer.userDatas[referrer.currentCluster].cloudInit.timezone = timezone
}

exports.setLocale = (referrer, locale) => {
  referrer.userDatas[referrer.currentCluster].cloudInit.locale = locale
}

exports.addWpaSupplicantOfYoursiteForWriteFilesArray = (referrer, country, ssid, passphrase = '', options = {}) => {
  const template = this.constructWpaSupplicant('yoursite')
  template.type_content.country = country
  template.type_content.network.ssid = ssid
  template.type_content.network.psk = passphrase
  _.forEach(options, (optValue, optKey) => {
    template.network[optKey] = optValue
  })
  referrer.userDatas[referrer.currentCluster].rdbox.write_files.shift()
  referrer.userDatas[referrer.currentCluster].rdbox.write_files.unshift(template)
}

exports.setHttpProxy = (referrer, stringOfProxy) => {
  referrer.userDatas[referrer.currentCluster].rdbox.write_files[this.getIndexOfWriteFs(referrer, 'http_proxy')].type_content = {
    http_proxy: stringOfProxy
  }
}

exports.setNoProxy = (referrer, stringOfProxy) => {
  referrer.userDatas[referrer.currentCluster].rdbox.write_files[this.getIndexOfWriteFs(referrer, 'no_proxy')].type_content = {
    no_proxy: stringOfProxy
  }
}

exports.updateUpdateDateOfCluster = (referrer) => {
  const ISO8601Date = this.constructISO8601()
  referrer.userDatas[referrer.currentCluster].info.updateDate = ISO8601Date
}

exports.addSuffixForRoleToTheClusterData = (referrer, role, id, parent) => {
  let findFlg = false
  _.map(referrer.userDatas[referrer.currentCluster].clusterData[role], (idParent) => {
    if (idParent.id === id) {
      findFlg = true
    }
  })
  if (!findFlg) {
    referrer.userDatas[referrer.currentCluster].clusterData[role].push({
      id,
      parent
    })
  }
}

exports.addClusterData = (referrer) => {
  const ISO8601Date = this.constructISO8601()
  referrer.userDatas[referrer.currentCluster].info.updateDate = ISO8601Date
}

exports.getListOfUserData = (referrer) => {
  return referrer.userDatas
}

exports.getUsernameOfRoot = (referrer) => {
  // eslint-disable-next-line no-magic-numbers
  return referrer.userDatas[referrer.currentCluster].cloudInit.users[0].name
}

exports.getUserpasswdOfRoot = (referrer) => {
  // eslint-disable-next-line no-magic-numbers
  return referrer.userDatas[referrer.currentCluster].cloudInit.users[0].passwd
}

exports.getPublicKeyOfRoot = (referrer) => {
  return referrer.userDatas[referrer.currentCluster].rdbox.files[this.getIndexOfFiles(referrer, 'publicKey')].from_path
}

exports.getSecretKeyOfRoot = (referrer) => {
  return referrer.userDatas[referrer.currentCluster].rdbox.files[this.getIndexOfFiles(referrer, 'secretKey')].from_path
}

exports.getClusterIdByIndex = (referrer, indexNo) => {
  return referrer.userDatas[indexNo].clusterData.id
}

exports.getAuthorizedKeysOfRoot = (referrer) => {
  return referrer.userDatas[referrer.currentCluster].cloudInit.users[0].ssh_authorized_keys
}

exports.getCountAuthorizedKeysOfRoot = (referrer) => {
  return referrer.userDatas[referrer.currentCluster].cloudInit.users[0].ssh_authorized_keys.length
}

exports.getNtpPoolsAndServers = (referrer) => {
  return referrer.userDatas[referrer.currentCluster].cloudInit.ntp
}

exports.getRdboxWriteFilesByFilesId = (referrer, filesId) => {
  return referrer.userDatas[referrer.currentCluster].rdbox.write_files[this.getIndexOfWriteFs(referrer, filesId)].type_content
}

exports.getRdboxRuncmdByFilesId = (referrer, filesId) => {
  return referrer.userDatas[referrer.currentCluster].rdbox.runcmd[this.getIndexOfRuncmd(referrer, filesId)]
}

exports.getWpaYoursiteOfWriteFiles = (referrer) => {
  return this.getRdboxWriteFilesByFilesId(referrer, 'wpa_supplicant_yoursite')
}

exports.getWpaBeOfWriteFiles = (referrer) => {
  return this.getRdboxWriteFilesByFilesId(referrer, 'wpa_supplicant_be')
}

exports.getWpaApanOfWriteFiles = (referrer) => {
  return this.getRdboxWriteFilesByFilesId(referrer, 'wpa_supplicant_ap_an')
}

exports.getWpaApbgOfWriteFiles = (referrer) => {
  return this.getRdboxWriteFilesByFilesId(referrer, 'wpa_supplicant_ap_bg')
}

exports.getHostapdBeOfWriteFiles = (referrer) => {
  return this.getRdboxWriteFilesByFilesId(referrer, 'hostapd_be')
}

exports.getHostapdApanOfWriteFiles = (referrer) => {
  return this.getRdboxWriteFilesByFilesId(referrer, 'hostapd_ap_an')
}

exports.getHostapdApbgOfWriteFiles = (referrer) => {
  return this.getRdboxWriteFilesByFilesId(referrer, 'hostapd_ap_bg')
}

exports.getHttpProxy = (referrer) => {
  return referrer.userDatas[referrer.currentCluster].rdbox.write_files[this.getIndexOfWriteFs(referrer, 'http_proxy')].type_content
}

exports.getNoProxy = (referrer) => {
  return referrer.userDatas[referrer.currentCluster].rdbox.write_files[this.getIndexOfWriteFs(referrer, 'no_proxy')].type_content
}

exports.getVpnBridgeOfWriteFiles = (referrer) => {
  return this.getRdboxWriteFilesByFilesId(referrer, 'vpnbridge')
}

exports.getKubeadmnJoinArgsOfRuncmd = (referrer) => {
  return this.getRdboxRuncmdByFilesId(referrer, 'to_run_kubeadm_join_after_communicating_with')
}

exports.getBranchParentArray = (referrer) => {
  const result = []
  _.map(referrer.userDatas[referrer.currentCluster].clusterData.BranchMaster, (item) => {
    result.push(item.id)
  })
  result.push('00')
  return result
}
