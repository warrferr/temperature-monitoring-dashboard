// Test script to verify webhook functionality
// Usage: node test-webhook.js YOUR_WEBHOOK_URL YOUR_PARTICLE_ID

const webhookUrl = process.argv[2] || 'https://your-project.supabase.co/functions/v1/particle-webhook';
const particleId = process.argv[3] || 'test-device-id';

const testPayload = {
  event: 'temp',  // Match your Particle event name
  data: '23.5',   // Temperature value as string
  published_at: new Date().toISOString(),
  coreid: particleId
};

console.log('Testing webhook with payload:', JSON.stringify(testPayload, null, 2));

fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testPayload)
})
.then(response => {
  console.log('Response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Response data:', JSON.stringify(data, null, 2));
})
.catch(error => {
  console.error('Error:', error);
});