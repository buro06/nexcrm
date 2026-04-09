var express = require('express');
var router = express.Router();
var { requireLogin } = require('../middleware/auth');

/* GET home page. */
router.get('/', requireLogin, function(req, res, next) {
  res.render('index', { title: 'CRM Ticket System' });
});

module.exports = router;
