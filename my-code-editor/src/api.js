import axios from 'axios';

// Create a new axios instance
const api = axios.create({
  baseURL: 'http://localhost:8000/api/', // Your Django API base URL
  withCredentials: true, // This is the magic line
});

export default api;