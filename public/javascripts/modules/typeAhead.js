import axios from 'axios'; // this is the same that import, web pack convert it to require
import dompurify from 'dompurify'; // prevent to trigger events

function searchResultsHTML(stores) {
  return dompurify.sanitize(stores.map(store => {
    return `
    <a href="/store/${store.slug}" class="search__result">
      <strong>${store.name}</strong>
    </a>
    `
  }).join(''));
}

function typeAhead(search) {
  if (!search) {
    return;
  }
  const searchInput = search.querySelector('input[name="search"]');
  const searchResults = search.querySelector('.search__results');

  searchInput.on('input', function () {
    if (!this.value) {
      searchResults.style.display = 'none';
      return;
    }

    searchResults.style.display = 'block';

    axios
      .get(`/api/search?q=${this.value}`)
      .then(res => {
        if (res.data.length) {
          searchResults.innerHTML = searchResultsHTML(res.data);
          return;
        }
        // Tell them nothing come back
        searchResults.innerHTML = dompurify.sanitize(`<div class="search__result">
        No results for <strong>${this.value}</strong> found!
        </div>`);
      })
      .catch(err => {
        console.error(err);
      });
  });

  // handling keyboard inputs
  searchInput.on('keyup', e => {
    const down = 40;
    const up = 38;
    const enter = 13;
    if (![up, down, enter].includes(e.keyCode)) {
      return;
    }
    const activeClass = 'search__result--active';
    const current = search.querySelector(`.${activeClass}`);
    const items = search.querySelectorAll('.search__result');
    let next;
    if (e.keyCode === down && current) {
      next = current.nextElementSibling || items[0];
    } else if (e.keyCode === down) {
      next = items[0];
    } else if (e.keyCode === up && current) {
      next = current.previousElementSibling || items[items.length - 1];
    } else if (e.keyCode === up) {
      next = items[items.length - 1];
    } else if (e.keyCode === enter && current) {
      window.location = current.href;
      return;
    } else {
      return;
    }

    if (current) {
      current.classList.remove(activeClass);
    }
    next.classList.add(activeClass);
  });
};

export default typeAhead;