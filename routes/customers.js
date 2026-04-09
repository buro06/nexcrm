var express = require('express');
var router = express.Router();
var { requireLogin } = require('../middleware/auth');
var db = require('../db');

var PAGE_SIZE = 20;

var PHONE_RE = /^\d{3}-\d{3}-\d{4}$/;

function formatPhone(val) {
  if (!val || !val.trim()) return null;
  var digits = val.replace(/\D/g, '');
  if (digits.length === 10) {
    return digits.slice(0, 3) + '-' + digits.slice(3, 6) + '-' + digits.slice(6);
  }
  return val.trim(); // return as-is; validator will catch bad formats
}

// List all customers (with search + pagination)
router.get('/customers', requireLogin, async function(req, res, next) {
  try {
    var q = (req.query.q || '').trim();
    var page = Math.max(1, parseInt(req.query.page) || 1);
    var offset = (page - 1) * PAGE_SIZE;

    var countSql, dataSql, params;
    if (q) {
      var like = '%' + q + '%';
      params = [like, like, like, like];
      countSql = 'SELECT COUNT(*) AS total FROM customers WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? OR address LIKE ?';
      dataSql  = 'SELECT * FROM customers WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? OR address LIKE ? ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    } else {
      params = [];
      countSql = 'SELECT COUNT(*) AS total FROM customers';
      dataSql  = 'SELECT * FROM customers ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    }

    var [[{ total }]] = await db.query(countSql, params);
    var [customers]   = await db.query(dataSql, [...params, PAGE_SIZE, offset]);
    var totalPages    = Math.ceil(total / PAGE_SIZE) || 1;

    res.render('customers/index', {
      title: 'Customers',
      customers,
      q,
      page,
      totalPages,
      total,
    });
  } catch (err) {
    next(err);
  }
});

// New customer form
router.get('/customers/new', requireLogin, function(req, res) {
  res.render('customers/new', { title: 'Add Customer', errors: [] });
});

// Create customer
router.post('/customers', requireLogin, async function(req, res, next) {
  var { name, email, address } = req.body;
  var phone = formatPhone(req.body.phone);
  var errors = [];

  if (!name || !name.trim()) errors.push('Name is required.');
  if (phone && !PHONE_RE.test(phone)) errors.push('Phone must be in format 000-000-0000.');

  if (errors.length) {
    return res.render('customers/new', {
      title: 'Add Customer',
      errors,
      values: req.body,
    });
  }

  try {
    await db.query(
      'INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)',
      [name.trim(), email || null, phone, address || null]
    );
    res.redirect('/customers');
  } catch (err) {
    next(err);
  }
});

// Edit customer form
router.get('/customers/:id/edit', requireLogin, async function(req, res, next) {
  try {
    var [rows] = await db.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.redirect('/customers');
    res.render('customers/edit', { title: 'Edit Customer', customer: rows[0], errors: [] });
  } catch (err) {
    next(err);
  }
});

// Update customer
router.post('/customers/:id', requireLogin, async function(req, res, next) {
  var { name, email, address } = req.body;
  var phone = formatPhone(req.body.phone);
  var errors = [];

  if (!name || !name.trim()) errors.push('Name is required.');
  if (phone && !PHONE_RE.test(phone)) errors.push('Phone must be in format 000-000-0000.');

  if (errors.length) {
    var [rows] = await db.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    return res.render('customers/edit', {
      title: 'Edit Customer',
      customer: { ...(rows[0] || {}), ...req.body },
      errors,
    });
  }

  try {
    await db.query(
      'UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
      [name.trim(), email || null, phone, address || null, req.params.id]
    );
    res.redirect('/customers');
  } catch (err) {
    next(err);
  }
});

// Delete customer
router.post('/customers/:id/delete', requireLogin, async function(req, res, next) {
  try {
    await db.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    res.redirect('/customers');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
