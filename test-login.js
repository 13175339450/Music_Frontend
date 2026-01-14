// 测试登录请求是否正确发送
import axios from 'axios';

// 直接使用axios发送请求，不通过拦截器
const testLogin = async () => {
  try {
    console.log('测试直接发送登录请求...');
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin',
      password: 'admin23'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('登录成功:', response.data);
  } catch (error) {
    console.error('登录失败:', error.response ? error.response.data : error.message);
    console.error('状态码:', error.response ? error.response.status : 'N/A');
    console.error('响应头:', error.response ? error.response.headers : 'N/A');
  }
};

testLogin();
