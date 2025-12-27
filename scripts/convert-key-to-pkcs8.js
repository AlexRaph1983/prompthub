/**
 * Локальная конвертация RSA private key из PKCS#1 (BEGIN RSA PRIVATE KEY)
 * в PKCS#8 (BEGIN PRIVATE KEY) без ssh-keygen.
 *
 * Это нужно, потому что PuTTY/plink может не принимать "old PEM format",
 * но часто принимает PKCS#8.
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const root = path.resolve(__dirname, '..')
const inPath = path.join(root, '.deploy_keys', 'orange_curium_rsa.pem')
const outPath = path.join(root, '.deploy_keys', 'orange_curium_rsa_pkcs8.pem')

function main() {
  const pem = fs.readFileSync(inPath, 'utf8')
  const keyObj = crypto.createPrivateKey(pem)
  const pkcs8 = keyObj.export({ type: 'pkcs8', format: 'pem' })
  fs.writeFileSync(outPath, pkcs8, 'utf8')
  console.log('OK:', outPath)
}

main()





