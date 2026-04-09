document.addEventListener('DOMContentLoaded', function () {
  var input = document.getElementById('phone');
  if (!input) return;

  input.addEventListener('input', function (e) {
    var digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    if (digits.length > 6) {
      e.target.value = digits.slice(0, 3) + '-' + digits.slice(3, 6) + '-' + digits.slice(6);
    } else if (digits.length > 3) {
      e.target.value = digits.slice(0, 3) + '-' + digits.slice(3);
    } else {
      e.target.value = digits;
    }
  });
});
