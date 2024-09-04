// search.js

let searchTimeout;

function debounceSearch(func, delay) {
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => func.apply(context, args), delay);
    };
}

function handleSearch() {
    const searchTerm = document.getElementById('addressSearch').value.toLowerCase();
    window.filteredLeaderboard = window.fullLeaderboard.filter(entry =>
        entry.address.toLowerCase().includes(searchTerm)
    );
    window.renderLeaderboard();
    window.updatePagination(window.filteredLeaderboard.length > window.ITEMS_PER_PAGE);
}

const debouncedHandleSearch = debounceSearch(handleSearch, 300);

function initializeSearch() {
    document.getElementById('addressSearch').addEventListener('input', debouncedHandleSearch);
}

// Export the initialization function
window.initializeSearch = initializeSearch;