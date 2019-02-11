const https = require('https');
const strftime = require('strftime');

const { Pool } = require('pg');
const pool = new Pool({
  user:     process.env.PG_USER,
  host:     process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port:     process.env.PG_PORT
});

const base_url = process.env.BASE_URL + '/site/' + process.env.SITE_ID + '/powerDetails?api_key=' + process.env.API_KEY;

setInterval(function() {
  var endTime = new Date();
  var startTime = endTime;
  startTime.setTime(startTime.getTime() - (15*60*1000));
  var url = base_url + '&startTime=' + strftime('%F %T', startTime) + '&endTime=' + strftime('%F %T', endTime);
  console.log(url)

  https.get(url, (res) => {
    const { statusCode } = res;
    const contentType = res.headers['content-type'];

    let error;
    if (statusCode !== 200) {
      error = new Error('Request Failed.\n' + 'Status Code: ' + statusCode);
    } else if (!/^application\/json/.test(contentType)) {
      error = new Error('Invalid content-type.\n' + 'Expected application/json but received ' + contentType);
    }
    if (error) {
      console.error(error.message);
      // consume response data to free up memory
      res.resume();
      return;
    }

    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      try {
        const data = JSON.parse(rawData);

        if(data && data.powerDetails && data.powerDetails.meters[0] && data.powerDetails.meters[0].values) {
          var latest_data = data.powerDetails.meters[0].values[data.powerDetails.meters[0].values.length - 1];

          console.log(latest_data);

          var text = 'INSERT INTO solarpower_logs( \
            value, \
            created_at \
          ) VALUES($1, $2) RETURNING id';

          var values = [parseFloat(latest_data.value) || 0, latest_data.created_at];

          pool.query(text, values).then(insert_res => {
            console.log(insert_res.rows[0]);
          }).catch(e => console.error(e.stack));
        }
      } catch (e) {
        console.error(e.message);
      }
    });
  }).on('error', (e) => {
    console.error('Got error: ' + e.message);
  });
}, (15*60*1000));
