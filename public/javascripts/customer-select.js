document.addEventListener('DOMContentLoaded', function() {
  var el = document.getElementById('customer_id');
  if (!el) return;

  new TomSelect(el, {
    valueField: 'id',
    labelField: 'name',
    searchField: ['name'],
    placeholder: 'Search customers…',
    options: JSON.parse(el.dataset.options || '[]'),
    items:   JSON.parse(el.dataset.items   || '[]'),
    load: function(query, callback) {
      if (!query.length) return callback();
      fetch('/api/customers/search?q=' + encodeURIComponent(query))
        .then(function(r) { return r.json(); })
        .then(callback)
        .catch(function() { callback(); });
    },
  });
});