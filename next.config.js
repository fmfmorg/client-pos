module.exports = {
    eslint:{
        ignoreDuringBuilds: true,
    },
    experimental:{
        webpackMemoryOptimizations: true,
    },
    devIndicators:false,
    webpack(config) {
        config.output.globalObject = 'self';
        return config;
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `http://localhost:8005/:path*`,
            },
            {
                source: '/printer/:path*',
                destination: `http://localhost:1008/:path*`,
            },
        ];
    },
};