const { faker } = require('@faker-js/faker');
const db = require('../db');

const ASSET_POOL = [
  { make: 'Dell',    model_number: 'XPS 15 9530',       display_name: 'Dell XPS 15' },
  { make: 'Dell',    model_number: 'OptiPlex 7090',      display_name: 'Dell OptiPlex 7090 Desktop' },
  { make: 'Dell',    model_number: 'Latitude 5540',      display_name: 'Dell Latitude 15' },
  { make: 'Apple',   model_number: 'MacBook Pro 14"',    display_name: 'MacBook Pro 14"' },
  { make: 'Apple',   model_number: 'MacBook Air M2',     display_name: 'MacBook Air M2' },
  { make: 'Apple',   model_number: 'Mac Mini M2',        display_name: 'Mac Mini M2' },
  { make: 'HP',      model_number: 'EliteBook 840 G10',  display_name: 'HP EliteBook 840' },
  { make: 'HP',      model_number: 'LaserJet Pro M404n', display_name: 'HP LaserJet Pro Printer' },
  { make: 'HP',      model_number: 'Pavilion 15-eg3',    display_name: 'HP Pavilion 15 Laptop' },
  { make: 'Lenovo',  model_number: 'ThinkPad X1 Carbon', display_name: 'Lenovo ThinkPad X1' },
  { make: 'Lenovo',  model_number: 'IdeaPad 5 Pro',      display_name: 'Lenovo IdeaPad 5 Pro' },
  { make: 'Lenovo',  model_number: 'ThinkCentre M90q',   display_name: 'Lenovo ThinkCentre Mini PC' },
  { make: 'Brother', model_number: 'HL-L2370DW',         display_name: 'Brother Laser Printer' },
  { make: 'Canon',   model_number: 'PIXMA TR8620',       display_name: 'Canon PIXMA Printer' },
  { make: 'Microsoft', model_number: 'Surface Pro 9',    display_name: 'Microsoft Surface Pro 9' },
];

function formatPhone(raw) {
  var digits = raw.replace(/\D/g, '').slice(-10).padStart(10, '0');
  return digits.slice(0, 3) + '-' + digits.slice(3, 6) + '-' + digits.slice(6);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedDemo() {
  var customerCount = 0;
  var assetCount = 0;

  for (var i = 0; i < 50000; i++) {
    var name  = faker.person.fullName();
    var email = faker.internet.email({ firstName: name.split(' ')[0], lastName: name.split(' ')[1] }).toLowerCase();
    var phone = formatPhone(faker.phone.number());
    var street = faker.location.streetAddress();
    var city   = faker.location.city();
    var state  = faker.location.state({ abbreviated: true });
    var zip    = faker.location.zipCode('#####');

    var [cResult] = await db.query(
      'INSERT INTO customers (name, email, phone, street, city, state, zip) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, phone, street, city, state, zip]
    );
    var customerId = cResult.insertId;
    customerCount++;

    var assetCountForCustomer = Math.random() < 0.5 ? 2 : 3;
    var usedIndexes = new Set();

    for (var j = 0; j < assetCountForCustomer; j++) {
      var idx;
      do { idx = Math.floor(Math.random() * ASSET_POOL.length); } while (usedIndexes.has(idx));
      usedIndexes.add(idx);

      var asset = ASSET_POOL[idx];
      var serial = faker.string.alphanumeric(10).toUpperCase();

      var [aResult] = await db.query(
        'INSERT INTO assets (display_name, make, model_number, serial_number, customer_id) VALUES (?, ?, ?, ?, ?)',
        [asset.display_name, asset.make, asset.model_number, serial, customerId]
      );
      var newTag = 'AST-' + String(aResult.insertId).padStart(5, '0');
      await db.query('UPDATE assets SET tag_number = ? WHERE id = ?', [newTag, aResult.insertId]);
      assetCount++;
    }
    if (i % 1000 === 0) console.log(i+'...')
  }

  console.log('Demo seed complete: ' + customerCount + ' customers, ' + assetCount + ' assets inserted.');
  process.exit(0);
}

seedDemo().catch(function(err) {
  console.error('Demo seed failed:', err.message);
  process.exit(1);
});
