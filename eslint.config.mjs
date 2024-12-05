// ioBroker eslint template configuration file for js and ts files
// Please note that esm or react based modules need additional modules loaded.
import config from '@iobroker/eslint-config';

export default [
    ...config,

    {
        // specify files to exclude from linting here
        ignores: [
            '*.test.js', 
            'test/**/*.js', 
            '*.config.mjs', 
            'build', 
            'admin/build', 
            'admin/words.js',
            'admin/admin.d.ts',
            '**/adapter-config.d.ts',
            '.dev-data/',
            '.dev-server/'     
        ] 
    },

    {
        // you may disable some 'jsdoc' warnings - but using jsdoc is highly recommended
        // as this improves maintainability. jsdoc warnings will not block buiuld process.
        rules: {
            // Note: you must disable the base rule as it can report incorrect errors
            "require-await": "off",
            "@typescript-eslint/require-await": "off",
            "no-duplicate-imports": "off",
            "no-empty": "warn",
            "jsdoc/require-jsdoc": 'off',
        },
    },
    
];