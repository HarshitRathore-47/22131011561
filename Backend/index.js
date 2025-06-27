const express = require('express');
const cors = require('cors');
const { requestLogger, logInfo, logError } = require('./loggerMiddleware');
const { createShortUrl, getUrlData, recordClick, isExpired ,getAllUrls} = require('./urlStore');

const app = express();
const PORT = process.env.PORT || 3000;
const HOSTNAME = process.env.HOSTNAME || `http://localhost:${PORT}`;

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Create Short URL - POST /shorturls
app.post('/shorturls', (req, res) => {
  const { url, validity, shortcode } = req.body;

  if (!url) {
    logError(`Short URL creation failed: missing url`);
    return res.status(400).json({ error: 'Missing required field: url' });
  }
  if (validity !== undefined && (typeof validity !== 'number' || validity <= 0)) {
    logError(`Short URL creation failed: invalid validity`);
    return res.status(400).json({ error: 'Validity must be a positive integer (minutes)' });
  }
  if (shortcode !== undefined && typeof shortcode !== 'string') {
    logError(`Short URL creation failed: invalid shortcode`);
    return res.status(400).json({ error: 'Shortcode must be a string' });
  }

  try {
    const { shortcode: code, expiry } = createShortUrl({
      url,
      validity: validity || 30,
      shortcode,
    });

    const shortlink = `${HOSTNAME}/${code}`;
    logInfo(`Short URL created: ${shortlink} -> ${url}`);

    return res.status(201).json({
      shortlink,
      expiry,
    });
  } catch (err) {
    logError(`Short URL creation failed: ${err.message}`);
    return res.status(409).json({ error: err.message });
  }
});

// Redirect short URL - GET /:shortcode
app.get('/:shortcode', (req, res) => {
  const { shortcode } = req.params;
  if (!shortcode) {
    logError('Redirect failed: missing shortcode');
    return res.status(400).json({ error: 'Shortcode required' });
  }

  const data = getUrlData(shortcode);
  if (!data) {
    logError(`Redirect failed: shortcode not found - ${shortcode}`);
    return res.status(404).json({ error: 'Shortcode not found' });
  }
  if (isExpired(shortcode)) {
    logError(`Redirect failed: shortcode expired - ${shortcode}`);
    return res.status(410).json({ error: 'Short link has expired' });
  }

  // Try to get referrer and geo from headers (geo is coarse - for example via ip, but here we mock as unknown)
  const referrer = req.get('referer') || req.get('referrer') || 'direct';
  // For actual geo location you'd call a geoip service. Here we will mock 'unknown' as requirement is coarse-grained.
  const geo = 'unknown';

  recordClick(shortcode, referrer, geo);
  logInfo(`Redirect: ${shortcode} clicked. Referrer: ${referrer}`);

  return res.redirect(data.url);
});

// Get stats - GET /shorturls/:shortcode
app.get('/shorturls/:shortcode', (req, res) => {
  const { shortcode } = req.params;
  const data = getUrlData(shortcode);

const debugMessage = `Stats request shortcode: ${shortcode}, data found: ${data ? 'yes' : 'no'}`;
  logInfo(debugMessage);




  if (!data) {
    logError(`Stats retrieval failed: shortcode not found - ${shortcode}`);
    return res.status(404).json({ error: 'Shortcode not found' });
  }

  return res.status(200).json({
    originalUrl: data.url,
    createdAt: data.createdAt,
    expiry: data.expiry,
    totalClicks: data.clicks.length,
    clicks: data.clicks.map(click => ({
      time: click.time,
      referrer: click.referrer,
      geo: click.geo,
    })),
  });
});
app.get('/shorturls', (req, res) => {
  const urls = getAllUrls().map(item => ({
    ...item,
    shortlink: `${req.protocol}://${req.get('host')}/${item.shortcode}`
  }));

  logInfo(`Stats summary requested. Total entries: ${urls.length}`);
  res.status(200).json(urls);
});

// 404 fallback
app.use((req, res) => {
  logError(`404 Not Found: ${req.originalUrl}`);
  res.status(404).json({ error: 'Not Found' });
});

// Error handler middleware
app.use((err, req, res, next) => {
  logError(`Internal server error: ${err.message}`);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  logInfo(`URL Shortener Microservice running on port ${PORT}`);
});