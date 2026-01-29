module.exports = {
    eslint:{
        ignoreDuringBuilds: true,
    },
    experimental:{
        webpackMemoryOptimizations: true,
    },
    devIndicators:false,
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