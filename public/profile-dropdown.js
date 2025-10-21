// Dropdown profile menu logic for desktop
// Opens on hover over profile, closes when mouse leaves the dropdown or profile
// Prevents dropdown from opening when hovering below (e.g. search input)
document.addEventListener('DOMContentLoaded', function() {
  var profileGroup = document.getElementById('profile-group');
  var dropdown = document.getElementById('profile-dropdown');
  if (profileGroup && dropdown) {
    var timeout;
    profileGroup.addEventListener('mouseenter', function() {
      clearTimeout(timeout);
      dropdown.classList.add('opacity-100');
      dropdown.classList.remove('opacity-0', 'pointer-events-none');
      dropdown.classList.add('pointer-events-auto');
    });
    profileGroup.addEventListener('mouseleave', function(e) {
      timeout = setTimeout(function() {
        dropdown.classList.remove('opacity-100', 'pointer-events-auto');
        dropdown.classList.add('opacity-0', 'pointer-events-none');
      }, 120);
    });
    dropdown.addEventListener('mouseenter', function() {
      clearTimeout(timeout);
    });
    dropdown.addEventListener('mouseleave', function() {
      timeout = setTimeout(function() {
        dropdown.classList.remove('opacity-100', 'pointer-events-auto');
        dropdown.classList.add('opacity-0', 'pointer-events-none');
      }, 120);
    });
  }
});
