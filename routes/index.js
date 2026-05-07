var express = require('express');
var router = express.Router();
var { requireLogin } = require('../middleware/auth');
var db = require('../db');


/* GET home page. */
router.get('/', requireLogin, async function (req, res, next) {
  var [[{ total: customerCount }]] = await db.query('SELECT COUNT(*) AS total FROM customers');
  var [[{ total: openTicketCount }]] = await db.query("SELECT COUNT(*) AS total FROM tickets WHERE status != 'complete'");
  res.render('index', { title: 'NexCRM', customerCount, openTicketCount });
});

module.exports = router;
