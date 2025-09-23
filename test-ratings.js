const http = require('http')

function testRatings() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/prompts',
      method: 'GET'
    }, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          console.log('=== API Prompts Response ===')
          console.log('Total items:', result.items?.length || 0)
          
          if (result.items && result.items.length > 0) {
            console.log('\nFirst 3 prompts:')
            result.items.slice(0, 3).forEach((item, i) => {
              console.log(`${i+1}. ${item.title}`)
              console.log(`   Rating: ${item.rating} (${item.ratingCount})`)
              console.log(`   ID: ${item.id}`)
            })
          }
          
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
    })
    
    req.on('error', reject)
    req.end()
  })
}

testRatings().catch(console.error)
