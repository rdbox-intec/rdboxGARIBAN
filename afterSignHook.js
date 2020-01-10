'use strict'

const { notarize } = require('electron-notarize')

async function main(context) {
  const { electronPlatformName, appOutDir } = context
  if (electronPlatformName !== 'darwin') {
    return
  }

  const appName = context.packager.appInfo.productFilename
  const appleId = process.env.APPLEID

  await notarize({
    appBundleId: 'jp.co.intec.gariban',
    appPath: `${appOutDir}/${appName}.app`,
    appleId,
    appleIdPassword: `@keychain:${appleId}`
  })
}

exports.default = main
