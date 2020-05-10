module.exports = {
    'root': true,
    'env': {
        'browser': true,
        'es6': true,
        'amd': true,
        'node': true,
    },
    'extends': [
        'eslint:recommended',
        'plugin:react/recommended'
    ],
    'globals': {
        'Atomics': 'readonly',
        'SharedArrayBuffer': 'readonly'
    },
    'parser': 'babel-eslint',
    'parserOptions': {
        'ecmaFeatures': {
            'jsx': true
        },
        'ecmaVersion': 2018,
        'sourceType': 'module'
    },
    'plugins': [
        'react',
        'babel',
    ],
    'rules': {
        "no-console": "off",
        "keyword-spacing": "error",
        "eqeqeq": ["error", "always"],
        "padding-line-between-statements": [
            "error",
            { "blankLine": "always", "prev": "*", "next": "const" },
            { "blankLine": "always", "prev": "const", "next": "*" },
            { "blankLine": "any", "prev": "const", "next": "const" },


            { "blankLine": "always", "prev": "*", "next": "let" },
            { "blankLine": "always", "prev": "let", "next": "*" },
            { "blankLine": "any", "prev": "let", "next": "let" },

            { "blankLine": "always", "prev": "block-like", "next": "*" },
            { "blankLine": "always", "prev": "*", "next": "return" },

            { "blankLine": "any", "prev": "const", "next": "let" },
            { "blankLine": "any", "prev": "let", "next": "const" },
        ],
        "no-var": "error",
        "comma-spacing": ["error", { "before": false, "after": true }],
        "no-unused-vars": ["error", { "args": "none" }],
        "key-spacing": ["error", { "afterColon": true }],
        "arrow-spacing": ["error", { "before": true, "after": true }],
        "comma-dangle": ["error", "always-multiline"],
        "object-curly-spacing": [
            "error",
            "always",
            { "arraysInObjects": true, "objectsInObjects": true }
        ],
        "space-infix-ops": [
            "error",
            { "int32Hint": false }
        ],
        'indent': [
            'error',
            4,
            { 'SwitchCase': 1 },
        ],
        'linebreak-style': [
            'error',
            'unix'
        ],
        'quotes': [
            'error',
            'single'
        ],
        'semi': [
            'error',
            'always'
        ]
    }
};
