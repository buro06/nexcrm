var express = require('express');
var router = express.Router();
var { requireLogin } = require('../middleware/auth');
var db = require('../db');


/* GET home page. */
router.get('/', requireLogin, async function (req, res, next) {
  var [[{total}]] = await db.query('SELECT COUNT(*) AS total FROM customers');
  var customerCount = total
  res.render('index', { title: 'NexCRM', customerCount });
});

module.exports = router;
