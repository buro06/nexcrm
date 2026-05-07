var express = require('express');
var router = express.Router();
var { requireLogin } = require('../middleware/auth');
var db = require('../db');

var PAGE_SIZE = 20;

// List assets
router.get('/assets', requireLogin, async function(req, res, next) {
  try {
    var q = (req.query.q || '').trim();
    var page = Math.max(1, parseInt(req.query.page) || 1);
    var offset = (page - 1) * PAGE_SIZE;

    var countSql, dataSql, params;
    if (q) {
      var like = '%' + q + '%';
      params = [like, like, like, like, like];
      countSql = 'SELECT COUNT(*) AS total FROM assets WHERE tag_number LIKE ? OR display_name LIKE ? OR make LIKE ? OR model_number LIKE ? OR serial_number LIKE ?';
      dataSql  = 'SELECT * FROM assets WHERE tag_number LIKE ? OR display_name LIKE ? OR make LIKE ? OR model_number LIKE ? OR serial_number LIKE ? ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    } else {
      params = [];
      countSql = 'SELECT COUNT(*) AS total FROM assets';
      dataSql  = 'SELECT * FROM assets ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    }

    var [[{ total }]] = await db.query(countSql, params);
    var [assets]      = await db.query(dataSql, [...params, PAGE_SIZE, offset]);
    var totalPages    = Math.ceil(total / PAGE_SIZE) || 1;

    res.render('assets/index', { title: 'Assets', assets, q, page, totalPages, total });
  } catch (err) {
    next(err);
  }
});

// New asset form
router.get('/assets/new', requireLogin, async function(req, res, next) {
  try {
    var [customers] = await db.query('SELECT id, name FROM customers ORDER BY name ASC');
    var [[{ next }]] = await db.query('SELECT COALESCE(MAX(id), 0) + 1 AS next FROM assets');
    var suggestedTag = 'AST-' + String(next).padStart(5, '0');
    var selectedCustomerId = req.query.customer_id || '';
    res.render('assets/new', { title: 'Add Asset', customers, suggestedTag, selectedCustomerId, errors: [] });
  } catch (err) {
    next(err);
  }
});

// Create asset
router.post('/assets', requireLogin, async function(req, res, next) {
  var { display_name, make, model_number, serial_number, notes, customer_id } = req.body;
  var tag_number = (req.body.tag_number || '').trim();
  var errors = [];

  if (!display_name || !display_name.trim()) errors.push('Display name is required.');
  if (!make || !make.trim()) errors.push('Make is required.');
  if (!model_number || !model_number.trim()) errors.push('Model number is required.');
  if (!customer_id) errors.push('Customer is required.');

  if (errors.length) {
    var [customers] = await db.query('SELECT id, name FROM customers ORDER BY name ASC');
    return res.render('assets/new', { title: 'Add Asset', customers, suggestedTag: tag_number, selectedCustomerId: customer_id || '', errors, values: req.body });
  }

  try {
    var [result] = await db.query(
      'INSERT INTO assets (tag_number, display_name, make, model_number, serial_number, notes, customer_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [tag_number || null, display_name.trim(), make.trim(), model_number.trim(), serial_number || null, notes || null, customer_id]
    );

    if (!tag_number) {
      var newTag = 'AST-' + String(result.insertId).padStart(5, '0');
      await db.query('UPDATE assets SET tag_number = ? WHERE id = ?', [newTag, result.insertId]);
    }

    res.redirect('/assets');
  } catch (err) {
    next(err);
  }
});

// Edit asset form
router.get('/assets/:id/edit', requireLogin, async function(req, res, next) {
  try {
    var [rows]      = await db.query('SELECT * FROM assets WHERE id = ?', [req.params.id]);
    var [customers] = await db.query('SELECT id, name FROM customers ORDER BY name ASC');
    if (rows.length === 0) return res.redirect('/assets');
    res.render('assets/edit', { title: 'Edit Asset', asset: rows[0], customers, errors: [] });
  } catch (err) {
    next(err);
  }
});

// Update asset
router.post('/assets/:id', requireLogin, async function(req, res, next) {
  var { display_name, make, model_number, serial_number, notes, customer_id } = req.body;
  var tag_number = (req.body.tag_number || '').trim();
  var errors = [];

  if (!display_name || !display_name.trim()) errors.push('Display name is required.');
  if (!make || !make.trim()) errors.push('Make is required.');
  if (!model_number || !model_number.trim()) errors.push('Model number is required.');
  if (!customer_id) errors.push('Customer is required.');

  if (errors.length) {
    var [rows]      = await db.query('SELECT * FROM assets WHERE id = ?', [req.params.id]);
    var [customers] = await db.query('SELECT id, name FROM customers ORDER BY name ASC');
    return res.render('assets/edit', { title: 'Edit Asset', asset: { ...(rows[0] || {}), ...req.body }, customers, errors });
  }

  try {
    await db.query(
      'UPDATE assets SET tag_number = ?, display_name = ?, make = ?, model_number = ?, serial_number = ?, notes = ?, customer_id = ? WHERE id = ?',
      [tag_number || null, display_name.trim(), make.trim(), model_number.trim(), serial_number || null, notes || null, customer_id, req.params.id]
    );
    res.redirect('/assets');
  } catch (err) {
    next(err);
  }
});

// Delete asset
router.post('/assets/:id/delete', requireLogin, async function(req, res, next) {
  try {
    await db.query('DELETE FROM assets WHERE id = ?', [req.params.id]);
    var ref = req.get('Referer') || '/assets';
    res.redirect(ref);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
