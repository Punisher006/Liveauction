// Simulated email service - in production, integrate with SendGrid, Mailgun, etc.
class EmailService {
    static async sendPasswordReset(email, resetLink) {
        // In a real application, you would integrate with an email service here
        // For demo purposes, we'll log the email and reset link
        console.log('📧 Password Reset Email:');
        console.log('To:', email);
        console.log('Reset Link:', resetLink);
        console.log('---');
        
        // Simulate email delay
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, 1000);
        });
    }

    static async sendWelcomeEmail(email, userName) {
        console.log('📧 Welcome Email:');
        console.log('To:', email);
        console.log('Welcome', userName);
        console.log('---');
        
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, 1000);
        });
    }
}

module.exports = EmailService;