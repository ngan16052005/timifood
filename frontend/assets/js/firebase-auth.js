// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDu3afqnuIOAgcJeT4AuYjDri1QHxHhFOk",
    authDomain: "timifood-e37f7.firebaseapp.com",
    projectId: "timifood-e37f7",
    storageBucket: "timifood-e37f7.firebasestorage.app",
    messagingSenderId: "571273969407",
    appId: "1:571273969407:web:f50a3a4dd01540b3d696ca",
    measurementId: "G-VE3SPG76CL"
};

if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    auth.languageCode = 'vi'; // Set Vietnamese SMS
    
    window.recaptchaVerifier = null;
    window.confirmationResult = null;
    
    // Initialize reCAPTCHA when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        const recaptchaContainer = document.getElementById('recaptcha-container');
        if (recaptchaContainer) {
            window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('send-otp-btn', {
                'size': 'invisible',
                'callback': (response) => {
                    // reCAPTCHA solved
                }
            });
        }
    });

    window.sendFirebaseOTP = async function(phoneNumberStr) {
        // Format to E.164 format (+84...)
        let formattedPhone = phoneNumberStr;
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '+84' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('+')) {
            formattedPhone = '+84' + formattedPhone;
        }

        try {
            const appVerifier = window.recaptchaVerifier;
            const confirmationResult = await auth.signInWithPhoneNumber(formattedPhone, appVerifier);
            window.confirmationResult = confirmationResult;
            return { success: true };
        } catch (error) {
            console.error('Lỗi khi gửi OTP:', error);
            // Reset recaptcha if error
            if (window.recaptchaVerifier) {
                try {
                    const widgetId = await window.recaptchaVerifier.render();
                    grecaptcha.reset(widgetId);
                } catch(e){}
            }
            return { success: false, message: error.message };
        }
    }
}
