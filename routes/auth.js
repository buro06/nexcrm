var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
var db = require('../db');

router.get('/login', function(req, res) {
  if (req.session.user) return res.redirect('/');
  res.render('login', { error: null });
});

router.post('/login', async function(req, res) {
  var { username, password } = req.body;

  if (!username || !password) {
    return res.render('login', { error: 'Username and password are required.' });
  }

  try {
    var [rows] = await db.query('SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1', [username, username]);

    if (rows.length === 0) {
      return res.render('login', { error: 'Invalid username or password.' });
    }

    var user = rows[0];
    var match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.render('login', { error: 'Invalid username or password.' });
    }

    req.session.user = { id: user.id, username: user.username, email: user.email };
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('login', { error: 'An error occurred. Please try again.' });
  }
});

router.get('/logout', function(req, res) {
  req.session.destroy(function() {
    res.redirect('/login');
  });
});

module.exports = router;
