
const axios = require('axios');

async function testPasswordChange() {
    try {
        const loginRes = await axios.post('http://localhost:3500/api/login', {
            phone: '0387878744',
            password: '123456'
        });
        
        const token = loginRes.data.token;
        console.log('Login successful, token received');

        const changeRes = await axios.post('http://localhost:3500/api/change-password', {
            currentPassword: '123456',
            newPassword: 'newpassword123'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Password change response:', changeRes.data);

        // Verify with new password
        const loginRes2 = await axios.post('http://localhost:3500/api/login', {
            phone: '0387878744',
            password: 'newpassword123'
        });
        console.log('Login with NEW password successful:', !!loginRes2.data.token);

    } catch (err) {
        console.error('Test failed:', err.response ? err.response.data : err.message);
    }
}

testPasswordChange();
