const https = require('https');
const url = `https://lingva.ml/api/v1/en/es/Hello`;
https.get(url, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
