document.addEventListener('DOMContentLoaded', function() {
  var customerEl = document.getElementById('customer_id');
  var assetEl    = document.getElementById('asset_id');
  if (!customerEl || !assetEl) return;

  var assetSelect = new TomSelect(assetEl, {
    valueField: 'id',
    labelField: 'label',
    searchField: ['label'],
    placeholder: 'Search assets…',
    options: JSON.parse(assetEl.dataset.options || '[]'),
    items:   JSON.parse(assetEl.dataset.items   || '[]'),
    load: function(query, callback) {
      var customerId = customerSelect.getValue();
      var url = '/api/assets/search?q=' + encodeURIComponent(query || '');
      if (customerId) url += '&customer_id=' + encodeURIComponent(customerId);
      fetch(url)
        .then(function(r) { return r.json(); })
        .then(callback)
        .catch(function() { callback(); });
    },
    onFocus: function() {
      if (!this.getValue()) this.load('');
    },
  });

  var customerSelect = new TomSelect(customerEl, {
    valueField: 'id',
    labelField: 'name',
    searchField: ['name'],
    placeholder: 'Search customers…',
    options: JSON.parse(customerEl.dataset.options || '[]'),
    items:   JSON.parse(customerEl.dataset.items   || '[]'),
    load: function(query, callback) {
      if (!query.length) return callback();
      fetch('/api/customers/search?q=' + encodeURIComponent(query))
        .then(function(r) { return r.json(); })
        .then(callback)
        .catch(function() { callback(); });
    },
    onChange: function() {
      assetSelect.clear();
      assetSelect.clearOptions();
    },
  });
});