import axios from 'axios';
import { SERVER_URL } from '../utils/constants';

export const loginApi = (username, password) => {
  return axios.post(`${SERVER_URL}/api/login`, { username, password });
};

export const fetchOrdersApi = (token) => {
  return axios.get(`${SERVER_URL}/api/orders/paginated?page=1&limit=50`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const updateOrderStatusApi = (orderId, status, token) => {
  return axios.put(`${SERVER_URL}/api/orders/${orderId}/status`,
    { status },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};
