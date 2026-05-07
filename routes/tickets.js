var express = require('express');
var router = express.Router();
var { requireLogin } = require('../middleware/auth');
var db = require('../db');

var PAGE_SIZE = 20;

var STATUS_LABELS = {
  open:            'Open',
  pending_payment: 'Pending Payment',
  waiting_pickup:  'Waiting Pickup',
  part_request:    'Part Request',
  complete:        'Complete',
};

// List tickets
router.get('/tickets', requireLogin, async function(req, res, next) {
  try {
    var q      = (req.query.q || '').trim();
    var status = req.query.status || '';
    var page   = Math.max(1, parseInt(req.query.page) || 1);
    var offset = (page - 1) * PAGE_SIZE;

    var conditions = [];
    var params = [];

    if (q) {
      var like = '%' + q + '%';
      conditions.push('(t.ticket_number LIKE ? OR t.issue LIKE ? OR c.name LIKE ?)');
      params.push(like, like, like);
    }
    if (status) {
      conditions.push('t.status = ?');
      params.push(status);
    } else {
      conditions.push("t.status != 'complete'");
    }

    var where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    var countSql = `SELECT COUNT(*) AS total FROM tickets t JOIN customers c ON t.customer_id = c.id ${where}`;
    var dataSql  = `
      SELECT t.*, c.name AS customer_name, a.display_name AS asset_name, a.tag_number AS asset_tag
      FROM tickets t
      JOIN customers c ON t.customer_id = c.id
      LEFT JOIN assets a ON t.asset_id = a.id
      ${where}
      ORDER BY t.updated_at DESC
      LIMIT ? OFFSET ?
    `;

    var [[{ total }]] = await db.query(countSql, params);
    var [tickets]     = await db.query(dataSql, [...params, PAGE_SIZE, offset]);
    var totalPages    = Math.ceil(total / PAGE_SIZE) || 1;

    res.render('tickets/index', { title: 'Tickets', tickets, q, status, page, totalPages, total, STATUS_LABELS });
  } catch (err) {
    next(err);
  }
});

// New ticket form
router.get('/tickets/new', requireLogin, async function(req, res, next) {
  try {
    var [customers] = await db.query('SELECT id, name FROM customers ORDER BY name ASC');
    var [assets]    = await db.query('SELECT id, tag_number, display_name, customer_id FROM assets ORDER BY display_name ASC');
    var [[{ next }]] = await db.query('SELECT COALESCE(MAX(id), 0) + 1 AS next FROM tickets');
    var suggestedNumber = 'TKT-' + String(next).padStart(5, '0');
    var selectedCustomerId = req.query.customer_id || '';
    var selectedAssetId    = req.query.asset_id    || '';
    res.render('tickets/new', {
      title: 'New Ticket', customers, assets, suggestedNumber,
      selectedCustomerId, selectedAssetId, STATUS_LABELS, errors: [], values: {}
    });
  } catch (err) {
    next(err);
  }
});

// Create ticket
router.post('/tickets', requireLogin, async function(req, res, next) {
  var { customer_id, asset_id, issue, solution, notes, status } = req.body;
  var errors = [];

  if (!customer_id)              errors.push('Customer is required.');
  if (!issue || !issue.trim())   errors.push('Issue is required.');
  var validStatuses = Object.keys(STATUS_LABELS);
  if (!status || !validStatuses.includes(status)) errors.push('Status is required.');

  if (errors.length) {
    try {
      var [customers] = await db.query('SELECT id, name FROM customers ORDER BY name ASC');
      var [assets]    = await db.query('SELECT id, tag_number, display_name, customer_id FROM assets ORDER BY display_name ASC');
      var [[{ next }]] = await db.query('SELECT COALESCE(MAX(id), 0) + 1 AS next FROM tickets');
      var suggestedNumber = 'TKT-' + String(next).padStart(5, '0');
      return res.render('tickets/new', {
        title: 'New Ticket', customers, assets, suggestedNumber,
        selectedCustomerId: customer_id || '', selectedAssetId: asset_id || '',
        STATUS_LABELS, errors, values: req.body
      });
    } catch (err) { return next(err); }
  }

  try {
    var [result] = await db.query(
      'INSERT INTO tickets (customer_id, asset_id, issue, solution, notes, status) VALUES (?, ?, ?, ?, ?, ?)',
      [customer_id, asset_id || null, issue.trim(), solution || null, notes || null, status]
    );
    var newNumber = 'TKT-' + String(result.insertId).padStart(5, '0');
    await db.query('UPDATE tickets SET ticket_number = ? WHERE id = ?', [newNumber, result.insertId]);
    res.redirect('/tickets/' + result.insertId);
  } catch (err) {
    next(err);
  }
});

// Show ticket
router.get('/tickets/:id', requireLogin, async function(req, res, next) {
  try {
    var [rows] = await db.query(`
      SELECT t.*, c.name AS customer_name, a.display_name AS asset_name, a.tag_number AS asset_tag
      FROM tickets t
      JOIN customers c ON t.customer_id = c.id
      LEFT JOIN assets a ON t.asset_id = a.id
      WHERE t.id = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.redirect('/tickets');
    res.render('tickets/show', { title: rows[0].ticket_number, ticket: rows[0], STATUS_LABELS });
  } catch (err) {
    next(err);
  }
});

// Edit ticket form
router.get('/tickets/:id/edit', requireLogin, async function(req, res, next) {
  try {
    var [rows]      = await db.query('SELECT * FROM tickets WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.redirect('/tickets');
    var [customers] = await db.query('SELECT id, name FROM customers ORDER BY name ASC');
    var [assets]    = await db.query('SELECT id, tag_number, display_name, customer_id FROM assets ORDER BY display_name ASC');
    res.render('tickets/edit', { title: 'Edit Ticket', ticket: rows[0], customers, assets, STATUS_LABELS, errors: [] });
  } catch (err) {
    next(err);
  }
});

// Update ticket
router.post('/tickets/:id', requireLogin, async function(req, res, next) {
  var { customer_id, asset_id, issue, solution, notes, status } = req.body;
  var errors = [];

  if (!customer_id)              errors.push('Customer is required.');
  if (!issue || !issue.trim())   errors.push('Issue is required.');
  var validStatuses = Object.keys(STATUS_LABELS);
  if (!status || !validStatuses.includes(status)) errors.push('Status is required.');

  if (errors.length) {
    try {
      var [rows]      = await db.query('SELECT * FROM tickets WHERE id = ?', [req.params.id]);
      var [customers] = await db.query('SELECT id, name FROM customers ORDER BY name ASC');
      var [assets]    = await db.query('SELECT id, tag_number, display_name, customer_id FROM assets ORDER BY display_name ASC');
      return res.render('tickets/edit', {
        title: 'Edit Ticket', ticket: { ...(rows[0] || {}), ...req.body },
        customers, assets, STATUS_LABELS, errors
      });
    } catch (err) { return next(err); }
  }

  try {
    await db.query(
      'UPDATE tickets SET customer_id = ?, asset_id = ?, issue = ?, solution = ?, notes = ?, status = ? WHERE id = ?',
      [customer_id, asset_id || null, issue.trim(), solution || null, notes || null, status, req.params.id]
    );
    res.redirect('/tickets/' + req.params.id);
  } catch (err) {
    next(err);
  }
});

// Update status only (quick action from show page)
router.post('/tickets/:id/status', requireLogin, async function(req, res, next) {
  var { status } = req.body;
  var validStatuses = ['open', 'pending_payment', 'waiting_pickup', 'part_request', 'complete'];
  if (!validStatuses.includes(status)) return res.redirect('/tickets/' + req.params.id);
  try {
    await db.query('UPDATE tickets SET status = ? WHERE id = ?', [status, req.params.id]);
    res.redirect('/tickets/' + req.params.id);
  } catch (err) {
    next(err);
  }
});

// Delete ticket
router.post('/tickets/:id/delete', requireLogin, async function(req, res, next) {
  try {
    await db.query('DELETE FROM tickets WHERE id = ?', [req.params.id]);
    res.redirect('/tickets');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
