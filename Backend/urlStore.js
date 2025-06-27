const crypto = require('crypto');

const urlDB = new Map(); // Key: shortcode, Value: url data object

// Validate shortcode: alphanumeric, length 4-10
function isValidShortcode(code) {
  return /^[a-zA-Z0-9]{4,10}$/.test(code);
}

function generateShortcode(length = 6) {
  // Generate unique shortcode that doesn't exist in urlDB
  let code;
  do {
    code = crypto.randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  } while (urlDB.has(code));
  return code;
}

function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function createShortUrl({ url, validity = 30, shortcode }) {
  if (!isValidUrl(url)) {
    throw new Error('Invalid URL format');
  }

  if (shortcode) {
    if (!isValidShortcode(shortcode)) {
      throw new Error('Invalid shortcode format. Must be alphanumeric and 4-10 chars.');
    }
    if (urlDB.has(shortcode)) {
      throw new Error('Shortcode already in use');
    }
  } else {
    shortcode = generateShortcode();
  }

  const now = new Date();
  const expiryDate = new Date(now.getTime() + validity * 60000);

  const data = {
    url,
    createdAt: now.toISOString(),
    expiry: expiryDate.toISOString(),
    clicks: [], // to store click info arrays
  };
  urlDB.set(shortcode, data);

  return { shortcode, expiry: data.expiry };
}

function getUrlData(shortcode) {
  if (!urlDB.has(shortcode)) return null;
  return urlDB.get(shortcode);
}

function recordClick(shortcode, referrer = 'unknown', geo = 'unknown') {
  const data = urlDB.get(shortcode);
  if (!data) return false;

  // Check expired
  if (new Date() > new Date(data.expiry)) return false;

  data.clicks.push({
    time: new Date().toISOString(),
    referrer,
    geo,
  });

  return true;
}

function isExpired(shortcode) {
  const data = urlDB.get(shortcode);
  if (!data) return true;
  return new Date() > new Date(data.expiry);
}

function getAllUrls() {
  const urls = [];
  for (const [shortcode, data] of urlDB.entries()) {
    urls.push({
      shortcode,
      ...data,
      totalClicks: data.clicks.length,
    });
  }
  return urls;
}

module.exports = {
  createShortUrl,
  getUrlData,
  recordClick,
  isExpired,
  getAllUrls // ✅ export it
};
