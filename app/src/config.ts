const config = {
    baseUrl: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost.charlesproxy.com:4000/api',
};

export default config;