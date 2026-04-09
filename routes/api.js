var express = require('express');
var router = express.Router();
var { requireLogin } = require('../middleware/auth');

// Nominatim address search proxy
// Proxying server-side lets us set a proper User-Agent as required by Nominatim's usage policy.
router.get('/api/address-search', requireLogin, async function(req, res) {
  var q = (req.query.q || '').trim();
  if (q.length < 3) return res.json([]);

  try {
    var url = 'https://nominatim.openstreetmap.org/search?' + new URLSearchParams({
      format: 'json',
      q: q,
      addressdetails: '1',
      limit: '6',
    });

    var response = await fetch(url, {
      headers: {
        'User-Agent': 'NexCRM/1.0',
        'Accept-Language': 'en',
      },
    });

    var data = await response.json();

    var results = data.map(function(item) {
      var a = item.address || {};
      var houseNumber = a.house_number || '';
      var road = a.road || a.pedestrian || a.footway || '';
      var street = (houseNumber + ' ' + road).trim();
      var city = a.city || a.town || a.village || a.hamlet || a.county || '';
      var state = a.state || '';
      var zip = a.postcode || '';

      return {
        display: item.display_name,
        street: street,
        city: city,
        state: state,
        zip: zip,
      };
    });

    res.json(results);
  } catch (err) {
    console.error('Nominatim error:', err.message);
    res.json([]);
  }
});

module.exports = router;
