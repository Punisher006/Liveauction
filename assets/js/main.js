// main.js: JavaScript functionality for the Live Auction frontend

// Handle navigation highlight
const navLinks = document.querySelectorAll('nav ul li a');
const currentPath = window.location.pathname;

navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPath.split('/').pop()) {
        link.classList.add('active');
    }
});

// Example: Display an alert when 'Get Started' button is clicked
const getStartedButton = document.querySelector('.btn');
if (getStartedButton) {
    getStartedButton.addEventListener('click', (event) => {
        event.preventDefault();
        alert('Redirecting to the dashboard!');
        window.location.href = 'dashboard.html';
    });
}

// Contact form submission
const contactForm = document.querySelector('form');
if (contactForm) {
    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('https://your-backend-url.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert('Message sent successfully!');
                contactForm.reset();
            } else {
                alert('Failed to send message. Please try again later.');
            }
        } catch (error) {
            alert('An error occurred. Please try again later.');
            console.error(error);
        }
    });
}

// Example: Dynamic content on the dashboard
const dashboardTable = document.querySelector('table tbody');
if (dashboardTable) {
    const auctions = [
        { name: 'Antique Vase', bid: '$500', time: '2 hours' },
        { name: 'Classic Painting', bid: '$1200', time: '1 day' },
        { name: 'Luxury Watch', bid: '$800', time: '4 hours' }
    ];

    auctions.forEach(auction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${auction.name}</td>
            <td>${auction.bid}</td>
            <td>${auction.time}</td>
        `;
        dashboardTable.appendChild(row);
    });
}
