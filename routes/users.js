var express = require('express');
const {requireLogin} = require("../middleware/auth");
var router = express.Router();
var db = require('../db');

/* GET users listing. */
router.get('/users', requireLogin, async function(req, res, next) {
  var [rows]  = await db.query('SELECT * FROM customers');
  res.send(rows.splice(0, rows.length));
});

module.exports = router;
