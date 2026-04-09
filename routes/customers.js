var express = require('express');
var router = express.Router();
var { requireLogin } = require('../middleware/auth');
var db = require('../db');

// List all customers
router.get('/customers', requireLogin, async function(req, res, next) {
  try {
    var [customers] = await db.query('SELECT * FROM customers ORDER BY name ASC');
    res.render('customers/index', { title: 'Customers', customers });
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
  var { name, email, phone, address } = req.body;

  if (!name || !name.trim()) {
    return res.render('customers/new', {
      title: 'Add Customer',
      errors: ['Name is required.'],
      values: req.body,
    });
  }

  try {
    await db.query(
      'INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)',
      [name.trim(), email || null, phone || null, address || null]
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
  var { name, email, phone, address } = req.body;

  if (!name || !name.trim()) {
    var [rows] = await db.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    return res.render('customers/edit', {
      title: 'Edit Customer',
      customer: rows[0] || {},
      errors: ['Name is required.'],
    });
  }

  try {
    await db.query(
      'UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
      [name.trim(), email || null, phone || null, address || null, req.params.id]
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
