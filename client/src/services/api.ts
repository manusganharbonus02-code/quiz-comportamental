import axios from 'axios';

// Define a URL base da API
// Em produção (Render), o servidor Node.js/Express está no mesmo domínio
// A Render espera que usemos o caminho relativo (ex: /api/questions)
// No desenvolvimento local, usamos a porta 4000.
// Usamos VITE_API_URL se estiver definido, caso contrário usamos uma string vazia
// que assume o mesmo domínio (útil para produção).
const API_URL = import.meta.env.VITE_API_URL || ''; 

// O Axios será configurado para usar a URL base
const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
