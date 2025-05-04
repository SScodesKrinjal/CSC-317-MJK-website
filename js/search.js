
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const searchButton = document.getElementById('search-button');
  const resultsContainer = document.getElementById('results');

  // Function to perform search
  async function performSearch() {
    const searchTerm = searchInput.value.trim();

    // Clear previous results
    resultsContainer.innerHTML = '';

    // Check if search term is empty
    if (!searchTerm) {
      resultsContainer.innerHTML = '<p>Please enter a search term.</p>';
      return;
    }

    try {
      // Fetch search results from the API
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const results = await response.json();

      // Display results
      if (results.length === 0) {
        resultsContainer.innerHTML = '<p>No results found.</p>';
      } else {
        // Create HTML for search results
        const resultHTML = results.map(nft => `
          <div class="search-result">
            <h3>${nft.NFTtitle}</h3>
            <p>${nft.NFTdescription}</p>
            <p>Price: $${nft.NFTprice}</p>
          </div>
        `).join('');

        resultsContainer.innerHTML = resultHTML;
      }
    } catch (error) {
      console.error('Search error:', error);
      resultsContainer.innerHTML = '<p>An error occurred during search.</p>';
    }
  }

  // Add event listeners for search
  searchButton.addEventListener('click', performSearch);
  searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      performSearch();
    }
  });
});
