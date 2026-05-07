var express = require('express');
var router = express.Router();
var { requireLogin } = require('../middleware/auth');
var db = require('../db');

router.get('/api/customers/search', requireLogin, async function(req, res) {
  var q = (req.query.q || '').trim();
  if (!q) return res.json([]);
  var like = '%' + q + '%';
  try {
    var [rows] = await db.query(
      'SELECT id, name FROM customers WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? ORDER BY name ASC LIMIT 12',
      [like, like, like]
    );
    res.json(rows);
  } catch (err) {
    res.json([]);
  }
});

router.get('/api/assets/search', requireLogin, async function(req, res) {
  var q          = (req.query.q || '').trim();
  var customerId = req.query.customer_id || '';
  var conditions = [];
  var params     = [];

  if (q) {
    var like = '%' + q + '%';
    conditions.push('(display_name LIKE ? OR tag_number LIKE ? OR make LIKE ?)');
    params.push(like, like, like);
  }
  if (customerId) {
    conditions.push('customer_id = ?');
    params.push(customerId);
  }

  var where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  try {
    var [rows] = await db.query(
      'SELECT id, tag_number, display_name FROM assets ' + where + ' ORDER BY display_name ASC LIMIT 15',
      params
    );
    var results = rows.map(function(a) {
      return { id: a.id, label: (a.tag_number ? '[' + a.tag_number + '] ' : '') + a.display_name };
    });
    res.json(results);
  } catch (err) {
    res.json([]);
  }
});

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
