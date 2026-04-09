document.addEventListener('DOMContentLoaded', function () {
  var streetInput = document.getElementById('street');
  if (!streetInput) return;

  var cityInput   = document.getElementById('city');
  var stateInput  = document.getElementById('state');
  var zipInput    = document.getElementById('zip');

  // Create dropdown container
  var dropdown = document.createElement('ul');
  dropdown.className = 'list-group shadow-sm position-absolute w-100';
  dropdown.style.cssText = 'z-index:1050;top:100%;left:0;display:none;max-height:240px;overflow-y:auto;';

  var wrapper = streetInput.parentElement;
  wrapper.style.position = 'relative';
  wrapper.appendChild(dropdown);

  var debounceTimer = null;
  var lastQuery = '';

  streetInput.addEventListener('input', function () {
    var q = streetInput.value.trim();
    clearTimeout(debounceTimer);

    if (q.length < 3 || q === lastQuery) {
      hideDropdown();
      return;
    }

    debounceTimer = setTimeout(function () {
      lastQuery = q;
      fetch('/api/address-search?q=' + encodeURIComponent(q))
        .then(function (r) { return r.json(); })
        .then(function (results) { showResults(results); })
        .catch(function () { hideDropdown(); });
    }, 600);
  });

  function showResults(results) {
    dropdown.innerHTML = '';
    if (!results.length) { hideDropdown(); return; }

    results.forEach(function (r) {
      var li = document.createElement('li');
      li.className = 'list-group-item list-group-item-action py-2 px-3';
      li.style.cursor = 'pointer';
      li.style.fontSize = '0.875rem';

      var main = document.createElement('div');
      main.className = 'fw-medium text-truncate';
      main.textContent = r.street || r.display;

      var sub = document.createElement('div');
      sub.className = 'text-muted small';
      sub.textContent = [r.city, r.state, r.zip].filter(Boolean).join(', ');

      li.appendChild(main);
      li.appendChild(sub);

      li.addEventListener('mousedown', function (e) {
        e.preventDefault(); // prevent blur before click
        fillFields(r);
        hideDropdown();
      });

      dropdown.appendChild(li);
    });

    dropdown.style.display = 'block';
  }

  function fillFields(r) {
    if (streetInput) streetInput.value = r.street || '';
    if (cityInput)   cityInput.value   = r.city   || '';
    if (stateInput)  stateInput.value  = r.state  || '';
    if (zipInput)    zipInput.value    = r.zip    || '';
  }

  function hideDropdown() {
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
  }

  streetInput.addEventListener('blur', function () {
    setTimeout(hideDropdown, 150);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') hideDropdown();
  });
});
