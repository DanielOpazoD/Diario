module.exports = {
    root: true,
    env: { browser: true, es2020: true },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react-hooks/recommended',
        'plugin:boundaries/recommended',
    ],
    ignorePatterns: ['dist', '.eslintrc.cjs'],
    parser: '@typescript-eslint/parser',
    plugins: ['react-refresh', 'boundaries', 'import'],
    settings: {
        'import/resolver': {
            typescript: {
                alwaysTryTypes: true,
            },
        },
        'boundaries/include': ['src/**/*'],
        'boundaries/elements': [
            {
                type: 'app',
                pattern: 'src/core/app',
            },
            {
                type: 'domain',
                pattern: 'src/domain',
            },
            {
                type: 'use-cases',
                pattern: 'src/use-cases',
            },
            {
                type: 'data',
                pattern: 'src/data',
            },
            {
                type: 'core',
                pattern: 'src/core',
            },
            {
                type: 'features',
                pattern: 'src/features/*',
                capture: ['featureName'],
            },
            {
                type: 'services',
                pattern: 'src/services',
            },
            {
                type: 'shared',
                pattern: 'src/shared',
            },
        ],
    },
    rules: {
        'react-refresh/only-export-components': [
            'warn',
            { allowConstantExport: true },
        ],
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        'boundaries/element-types': [
            2,
            {
                default: 'allow',
                rules: [
                    {
                        from: 'shared',
                        disallow: ['app', 'core', 'features', 'services', 'domain', 'use-cases'],
                        message: 'Shared modules cannot import from upper layers',
                    },
                    {
                        from: 'domain',
                        disallow: ['app', 'core', 'features', 'services', 'use-cases'],
                        message: 'Domain cannot import from UI or service layers',
                    },
                    {
                        from: 'use-cases',
                        disallow: ['app', 'core', 'features'],
                        message: 'Use-cases cannot import from UI layers',
                    },
                    {
                        from: 'data',
                        disallow: ['app', 'core', 'features'],
                        message: 'Data layer cannot import from UI layers',
                    },
                    {
                        from: 'services',
                        disallow: ['app', 'core', 'features'],
                        message: 'Services cannot import from UI layers (Core/Features)',
                    },
                    {
                        from: 'core',
                        disallow: ['app', 'features'],
                        message: 'Core cannot import from App or Features (circular dependency risk)',
                    },
                    {
                        from: 'features',
                        disallow: [
                            ['features', { 'featureName': '!${featureName}' }]
                        ],
                        message: 'Features cannot import from other Features directly. Use Shared/Core/AppStore.',
                    },
                ],
            },
        ],
        'boundaries/entry-points': [
            2,
            {
                default: 'disallow',
                rules: [
                    {
                        target: 'domain',
                        allow: '**/*',
                    },
                    {
                        target: 'use-cases',
                        allow: '**/*',
                    },
                    {
                        target: 'data',
                        allow: '**/*',
                    },
                    {
                        target: [['features', { 'featureName': '*' }]],
                        allow: 'index.ts',
                    },
                    {
                        target: [['core', { 'coreModule': '*' }]],
                        allow: 'index.ts',
                    },
                    {
                        target: 'shared',
                        allow: '**/*',
                    },
                    {
                        target: 'services',
                        allow: '**/*',
                    }
                ],
            },
        ],
    },
};
