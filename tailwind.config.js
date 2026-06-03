import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Outfit', 'Inter', 'Figtree', ...defaultTheme.fontFamily.sans],
                serif: ['"Playfair Display"', 'Georgia', 'serif'],
            },
            colors: {
                brand: {
                    taupe: '#8C7A6B',
                    cream: '#D4C5B9',
                    alabaster: '#FAF8F5',
                    espresso: '#2C2520',
                    gold: '#C5A880',
                    sage: '#8B9A86',
                }
            }
        },
    },

    plugins: [forms],
};
