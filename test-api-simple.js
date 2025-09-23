const http = require('http')

function testViewTokenAPI() {
  const postData = JSON.stringify({
    cardId: 'promptmaster-01',
    fingerprint: 'test-fingerprint-123'
  })

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/view-token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`)
    console.log(`Headers: ${JSON.stringify(res.headers)}`)
    
    let data = ''
    res.on('data', (chunk) => {
      data += chunk
    })
    
    res.on('end', () => {
      console.log('Response body:', data)
      if (res.statusCode === 200) {
        console.log('✅ View token API works!')
      } else {
        console.log('❌ View token API failed')
      }
    })
  })

  req.on('error', (e) => {
    console.error(`❌ Problem with request: ${e.message}`)
  })

  req.write(postData)
  req.end()
}

console.log('Testing view-token API...')
testViewTokenAPI()
