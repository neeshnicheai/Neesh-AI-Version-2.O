const http = require('http');

const body = JSON.stringify({
    projectId: '00000000-0000-0000-0000-000000000001',
    query: 'Hello! What can you help me with?'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/internal/chat',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': 'neesh-ai-secret-key-123',
        'Content-Length': Buffer.byteLength(body)
    }
};

console.log('[Test] Sending chat request to AI service...');
const req = http.request(options, (res) => {
    let data = '';
    console.log('[Test] Status:', res.statusCode);
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            console.log('[Test] SUCCESS!');
            console.log('[Test] Answer:', parsed.answer);
            console.log('[Test] Confidence:', parsed.confidence);
        } catch (e) {
            console.log('[Test] Raw response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error('[Test] Error:', e.message);
});

req.write(body);
req.end();
