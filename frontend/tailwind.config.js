module.exports = {
    darkMode: "class",
    content: ['./src/**/*.{ts,tsx}', "types.d.ts"],
    theme: { extend: {} },
    plugins: [
        require('tailwind-scrollbar')({ nocompatible: false })  // false = standards-track only
    ]
}