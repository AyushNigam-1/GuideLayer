module.exports = {
    content: ['./src/**/*.{ts,tsx}'],
    theme: { extend: {} },
    plugins: [
        require('tailwind-scrollbar')({ nocompatible: false })  // false = standards-track only
    ]
}