const http = require('http')

async function testFullTracking() {
  console.log('=== Testing full view tracking cycle ===')
  
  try {
    // Шаг 1: Получить токен
    console.log('Step 1: Getting view token...')
    const tokenResponse = await makeRequest('/api/view-token', {
      cardId: 'promptmaster-01',
      fingerprint: 'test-fingerprint-123'
    })
    
    if (tokenResponse.statusCode !== 200) {
      console.log('❌ Failed to get token:', tokenResponse.body)
      return
    }
    
    const tokenData = JSON.parse(tokenResponse.body)
    console.log('✅ Token received:', tokenData.viewToken)
    
    // Шаг 2: Отправить просмотр
    console.log('Step 2: Tracking view...')
    const trackResponse = await makeRequest('/api/track-view', {
      cardId: 'promptmaster-01',
      viewToken: tokenData.viewToken
    })
    
    if (trackResponse.statusCode !== 200) {
      console.log('❌ Failed to track view:', trackResponse.body)
      return
    }
    
    const trackData = JSON.parse(trackResponse.body)
    console.log('✅ View tracked:', trackData)
    
    console.log('✅ Full tracking cycle successful!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data)
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }

    const req = http.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body })
      })
    })

    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}

testFullTracking()
