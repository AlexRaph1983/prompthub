#!/usr/bin/env node

/**
 * Скрипт для валидации sitemap и robots.txt
 * Запуск: node scripts/validate-sitemap.js
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const BASE_URL = process.env.BASE_URL || 'https://prompt-hub.site';
const TIMEOUT = 10000; // 10 секунд

// Цвета для консоли
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout: TIMEOUT,
      headers: {
        'User-Agent': 'Sitemap-Validator/1.0'
      }
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        data
      }));
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    req.end();
  });
}

async function validateRobotsTxt() {
  log('\n🤖 Проверка robots.txt...', 'blue');
  
  try {
    const response = await makeRequest(`${BASE_URL}/robots.txt`);
    
    if (response.status !== 200) {
      log(`❌ robots.txt недоступен (статус: ${response.status})`, 'red');
      return false;
    }

    const content = response.data;
    const checks = [
      { name: 'User-agent: *', test: content.includes('User-agent: *') },
      { name: 'Disallow: /api/', test: content.includes('Disallow: /api/') },
      { name: 'Disallow: /admin/', test: content.includes('Disallow: /admin/') },
      { name: 'Disallow: /dashboard/', test: content.includes('Disallow: /dashboard/') },
      { name: 'Sitemap ссылка', test: content.includes('Sitemap:') },
      { name: 'Host директива', test: content.includes('Host:') },
      { name: 'Clean-param', test: content.includes('Clean-param:') }
    ];

    let allPassed = true;
    checks.forEach(check => {
      if (check.test) {
        log(`  ✅ ${check.name}`, 'green');
      } else {
        log(`  ❌ ${check.name}`, 'red');
        allPassed = false;
      }
    });

    return allPassed;
  } catch (error) {
    log(`❌ Ошибка при проверке robots.txt: ${error.message}`, 'red');
    return false;
  }
}

async function validateSitemapIndex() {
  log('\n🗺️ Проверка sitemap.xml...', 'blue');
  
  try {
    const response = await makeRequest(`${BASE_URL}/sitemap.xml`);
    
    if (response.status !== 200) {
      log(`❌ sitemap.xml недоступен (статус: ${response.status})`, 'red');
      return false;
    }

    if (!response.headers['content-type']?.includes('application/xml')) {
      log('❌ Неверный Content-Type для sitemap.xml', 'red');
      return false;
    }

    const content = response.data;
    const checks = [
      { name: 'XML декларация', test: content.includes('<?xml version="1.0" encoding="UTF-8"?>') },
      { name: 'sitemapindex тег', test: content.includes('<sitemapindex') },
      { name: 'root.xml ссылка', test: content.includes('/sitemaps/root.xml') },
      { name: 'ru.xml ссылка', test: content.includes('/sitemaps/ru.xml') },
      { name: 'en.xml ссылка', test: content.includes('/sitemaps/en.xml') },
      { name: 'categories.xml ссылка', test: content.includes('/sitemaps/categories.xml') },
      { name: 'tags.xml ссылка', test: content.includes('/sitemaps/tags.xml') }
    ];

    let allPassed = true;
    checks.forEach(check => {
      if (check.test) {
        log(`  ✅ ${check.name}`, 'green');
      } else {
        log(`  ❌ ${check.name}`, 'red');
        allPassed = false;
      }
    });

    return allPassed;
  } catch (error) {
    log(`❌ Ошибка при проверке sitemap.xml: ${error.message}`, 'red');
    return false;
  }
}

async function validateSitemapFile(path, name) {
  try {
    const response = await makeRequest(`${BASE_URL}${path}`);
    
    if (response.status !== 200) {
      log(`  ❌ ${name} недоступен (статус: ${response.status})`, 'red');
      return false;
    }

    if (!response.headers['content-type']?.includes('application/xml')) {
      log(`  ❌ Неверный Content-Type для ${name}`, 'red');
      return false;
    }

    const content = response.data;
    const hasXmlDeclaration = content.includes('<?xml version="1.0" encoding="UTF-8"?>');
    const hasUrlset = content.includes('<urlset');
    const hasUrls = content.includes('<url>');

    if (hasXmlDeclaration && hasUrlset && hasUrls) {
      log(`  ✅ ${name}`, 'green');
      return true;
    } else {
      log(`  ❌ ${name} - невалидный XML`, 'red');
      return false;
    }
  } catch (error) {
    log(`  ❌ Ошибка при проверке ${name}: ${error.message}`, 'red');
    return false;
  }
}

async function validateAllSitemaps() {
  log('\n📄 Проверка дочерних sitemap карт...', 'blue');
  
  const sitemaps = [
    { path: '/sitemaps/root.xml', name: 'Root sitemap' },
    { path: '/sitemaps/ru.xml', name: 'RU sitemap' },
    { path: '/sitemaps/en.xml', name: 'EN sitemap' },
    { path: '/sitemaps/categories.xml', name: 'Categories sitemap' },
    { path: '/sitemaps/tags.xml', name: 'Tags sitemap' },
    { path: '/sitemaps/prompts-0001.xml', name: 'Prompts sitemap (page 1)' }
  ];

  let allPassed = true;
  for (const sitemap of sitemaps) {
    const passed = await validateSitemapFile(sitemap.path, sitemap.name);
    if (!passed) allPassed = false;
  }

  return allPassed;
}

async function main() {
  log('🔍 Валидация SEO sitemap и robots.txt', 'bold');
  log(`🌐 Проверяем: ${BASE_URL}`, 'blue');
  
  const results = {
    robots: await validateRobotsTxt(),
    sitemapIndex: await validateSitemapIndex(),
    sitemaps: await validateAllSitemaps()
  };

  log('\n📊 Результаты проверки:', 'bold');
  log(`robots.txt: ${results.robots ? '✅' : '❌'}`, results.robots ? 'green' : 'red');
  log(`sitemap.xml: ${results.sitemapIndex ? '✅' : '❌'}`, results.sitemapIndex ? 'green' : 'red');
  log(`дочерние карты: ${results.sitemaps ? '✅' : '❌'}`, results.sitemaps ? 'green' : 'red');

  const allPassed = results.robots && results.sitemapIndex && results.sitemaps;
  
  if (allPassed) {
    log('\n🎉 Все проверки пройдены успешно!', 'green');
    log('🚀 Sitemap готов к индексации поисковиками', 'green');
  } else {
    log('\n⚠️ Обнаружены проблемы, требующие исправления', 'yellow');
    process.exit(1);
  }
}

// Запуск
if (require.main === module) {
  main().catch(error => {
    log(`💥 Критическая ошибка: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { validateRobotsTxt, validateSitemapIndex, validateAllSitemaps };
