const config = {
    baseUrl: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:4001/api',
    baseAttachmentUrl: process.env.NODE_ENV === 'production' ? '/attachment' : 'http://localhost:4001/attachment',
};

export default config;
