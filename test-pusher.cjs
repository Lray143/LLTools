const https = require('https');
const crypto = require('crypto');
require('dotenv').config();

const appId = process.env.PUSHER_APP_ID;
const key = process.env.VITE_PUSHER_KEY;
const secret = process.env.PUSHER_SECRET;
const cluster = process.env.VITE_PUSHER_CLUSTER || 'ap1';

const body = JSON.stringify({
  name: 'new-message',
  channel: 'lltools-updates',
  data: JSON.stringify({
    roomId: 'DM_1_8',
    senderId: '8',
    senderName: 'LAWRENCE DULLO',
    message: {
      id: crypto.randomUUID(),
      senderId: '8',
      senderName: 'LAWRENCE DULLO',
      message: 'Hello from Node Test Script!',
      createdAt: new Date().toISOString(),
      isUnsent: false
    }
  })
});

const timestamp = Math.floor(Date.now() / 1000);
const md5Body = crypto.createHash('md5').update(body).digest('hex');
const reqPath = `/apps/${appId}/events`;
const paramStr = `auth_key=${key}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${md5Body}`;
const toSign = `POST\n${reqPath}\n${paramStr}`;
const signature = crypto.createHmac('sha256', secret).update(toSign).digest('hex');
const queryStr = `${paramStr}&auth_signature=${signature}`;

const options = {
  hostname: `api-${cluster}.pusher.com`,
  path: `${reqPath}?${queryStr}`,
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
};

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  res.on('data', d => process.stdout.write(d));
});
req.on('error', console.error);
req.write(body);
req.end();
