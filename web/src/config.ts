const API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:8080/api'
  : '/api';

export { API_BASE_URL };