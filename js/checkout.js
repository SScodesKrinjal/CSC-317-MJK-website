
// js/checkout.js
document.addEventListener('DOMContentLoaded', function() {
    const checkoutForm = document.getElementById('checkout-form');
    
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Takes in user values for credit card and other important features
        const formData = {
            creditCard: document.getElementById('credit-card').value,
            ssn: document.getElementById('ssn').value,
            mothersMaidenName: document.getElementById('mothers-maiden-name').value
        };
// Attempt to POST, awaits response, and catches error if any
        try {
            const response = await fetch('/api/cart/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            
            if (data.success) {
                window.location.href = '/purchase-success';
            } else {
                alert('Checkout failed: ' + data.error);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error processing checkout');
        }
    });
});
