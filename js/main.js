// In /js/main.js
document.addEventListener("DOMContentLoaded", function() {
    const addToCartButtons = document.querySelectorAll(".add-to-cart-btn");

    addToCartButtons.forEach(button => {
        button.addEventListener("click", async function(event) {
            const nftId = this.dataset.nftId;
            try {
                const response = await fetch('/api/cart/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ nftId }),
                    credentials: 'same-origin' // Important! This sends cookies with the request
                });

                const data = await response.json();
                
                if (response.status === 401) {
                    alert('Please log in to add items to cart');
                    window.location.href = '/login';
                    return;
                }

                if (data.success) {
                    this.textContent = "Added!";
                    this.style.background = "linear-gradient(to bottom, #46ae4b 0%, #2f7c33 100%)";
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error adding to cart');
            }
        });
    });
});
