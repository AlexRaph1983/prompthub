/**
 * Генерация RSA ключа для деплоя (локально, без ssh-keygen, без зависаний entropy).
 * Выход:
 * - .deploy_keys/orange_curium_rsa.pem        (private, PKCS#1 PEM)
 * - .deploy_keys/orange_curium_rsa.pub       (OpenSSH public key: ssh-rsa AAAA...)
 *
 * Дальше private можно конвертировать в PPK через puttygen для plink.
 */

const fs = require('fs')
const path = require('path')
const { generateKeyPairSync } = require('crypto')
const { execFileSync } = require('child_process')

const root = path.resolve(__dirname, '..')
const dir = path.join(root, '.deploy_keys')
const privPath = path.join(dir, 'orange_curium_rsa.pem')
const pubPath = path.join(dir, 'orange_curium_rsa.pub')

function main() {
  fs.mkdirSync(dir, { recursive: true })

  // Генерируем RSA 4096 (быстро и без зависимости от ssh-keygen entropy)
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicExponent: 0x10001,
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
  })

  fs.writeFileSync(privPath, privateKey, { encoding: 'utf8' })

  // Получаем OpenSSH public key из приватного через ssh-keygen -y (это НЕ генерирует entropy и обычно не виснет)
  const sshKeygen = 'C:\\\\Windows\\\\System32\\\\OpenSSH\\\\ssh-keygen.exe'
  const pub = execFileSync(sshKeygen, ['-y', '-f', privPath], { encoding: 'utf8' }).trim()
  if (!pub.startsWith('ssh-rsa ')) {
    throw new Error(`Unexpected public key format: ${pub.slice(0, 40)}`)
  }

  fs.writeFileSync(pubPath, pub + '\n', { encoding: 'utf8' })

  console.log('OK')
  console.log('PRIVATE:', privPath)
  console.log('PUBLIC :', pubPath)
}

main()




