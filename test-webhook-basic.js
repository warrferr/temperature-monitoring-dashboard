// Basic webhook accessibility test
// Usage: node test-webhook-basic.js YOUR_WEBHOOK_URL

const webhookUrl = process.argv[2] || 'https://your-project.supabase.co/functions/v1/particle-webhook';

console.log(`Testing webhook accessibility: ${webhookUrl}`);

// Test OPTIONS (CORS preflight)
fetch(webhookUrl, { method: 'OPTIONS' })
  .then(response => {
    console.log('OPTIONS response status:', response.status);
    console.log('CORS headers present:', response.headers.has('Access-Control-Allow-Origin'));
    return response.text();
  })
  .then(text => console.log('OPTIONS response:', text))
  .catch(error => console.error('OPTIONS error:', error));

// Test GET (should return 405 Method Not Allowed)  
setTimeout(() => {
  fetch(webhookUrl, { method: 'GET' })
    .then(response => {
      console.log('GET response status:', response.status);
      return response.json();
    })
    .then(data => console.log('GET response:', data))
    .catch(error => console.error('GET error:', error));
}, 1000);