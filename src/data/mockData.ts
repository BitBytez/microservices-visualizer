import type { GraphConfig } from '../types';

export const defaultConfig: GraphConfig = {
    services: [
        {
            id: 'api-gateway',
            name: 'API Gateway',
            type: 'gateway',
            description: 'Main entry point for all client requests. Routes traffic to internal services.',
            color: '#6366f1',
            links: [
                { label: 'Runbook', url: 'https://wiki.example.com/api-gateway' },
                { label: 'Repository', url: 'https://github.com/example/api-gateway' },
            ],
        },
        {
            id: 'auth-service',
            name: 'Auth Service',
            type: 'microservice',
            description: 'Handles authentication, authorization, and JWT token management.',
            color: '#f43f5e',
            links: [
                { label: 'Repository', url: 'https://github.com/example/auth-service' },
            ],
        },
        {
            id: 'user-service',
            name: 'User Service',
            type: 'microservice',
            description: 'User profile management, preferences, and account operations.',
            color: '#8b5cf6',
        },
        {
            id: 'postgres-main',
            name: 'PostgreSQL DB',
            type: 'database',
            description: 'Relational database for users and authentication data.',
            color: '#3b82f6',
        },
        {
            id: 'redis-cache',
            name: 'Redis Cache',
            type: 'cache',
            description: 'In-memory cache for sessions and rate limiting.',
            color: '#ef4444',
        },
        {
            id: 'rabbitmq',
            name: 'RabbitMQ',
            type: 'queue',
            description: 'Message broker for async communication and event sourcing.',
            color: '#f97316',
        },
        {
            id: 'cdn',
            name: 'CloudFront CDN',
            type: 'cdn',
            description: 'Content delivery network for static frontend assets.',
            color: '#a855f7',
        },
    ],
    connections: [
        {
            id: 'conn-1',
            source: 'api-gateway',
            target: 'auth-service',
            label: 'Auth',
            dashboards: [
                {
                    id: 'dash-1',
                    title: 'Auth Latency (p99)',
                    iframeUrl: 'https://play.grafana.org/d-solo/000000012/grafana-play-home?orgId=1&panelId=4',
                },
                {
                    id: 'dash-2',
                    title: 'Auth Error Rate',
                    iframeUrl: 'https://play.grafana.org/d-solo/000000012/grafana-play-home?orgId=1&panelId=3',
                },
            ],
        },
        {
            id: 'conn-2',
            source: 'api-gateway',
            target: 'user-service',
            label: 'Users',
            dashboards: [
                {
                    id: 'dash-3',
                    title: 'User API Throughput',
                    iframeUrl: 'https://play.grafana.org/d-solo/000000012/grafana-play-home?orgId=1&panelId=2',
                },
            ],
        },
        {
            id: 'conn-3',
            source: 'auth-service',
            target: 'redis-cache',
            label: 'Sessions',
            dashboards: [
                {
                    id: 'dash-4',
                    title: 'Redis Hit Rate',
                    iframeUrl: 'https://play.grafana.org/d-solo/000000012/grafana-play-home?orgId=1&panelId=2',
                },
            ],
        },
        {
            id: 'conn-4',
            source: 'auth-service',
            target: 'postgres-main',
            label: 'User Auth',
            dashboards: [],
        },
        {
            id: 'conn-5',
            source: 'user-service',
            target: 'postgres-main',
            label: 'User Data',
            dashboards: [
                {
                    id: 'dash-5',
                    title: 'DB Query Time',
                    iframeUrl: 'https://play.grafana.org/d-solo/000000012/grafana-play-home?orgId=1&panelId=4',
                },
            ],
        },
        {
            id: 'conn-6',
            source: 'user-service',
            target: 'rabbitmq',
            label: 'User Events',
            dashboards: [
                {
                    id: 'dash-6',
                    title: 'Queue Depth',
                    iframeUrl: 'https://play.grafana.org/d-solo/000000012/grafana-play-home?orgId=1&panelId=2',
                },
            ],
        },
        {
            id: 'conn-7',
            source: 'api-gateway',
            target: 'cdn',
            label: 'Static Assets',
            dashboards: [],
        },
    ],
};
