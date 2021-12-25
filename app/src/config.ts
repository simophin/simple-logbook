const config = {
    baseUrl: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:4000/api',
    baseAttachmentUrl: process.env.NODE_ENV === 'production' ? '/attachment' : 'http://localhost:4000/attachment',
};

export default config;
