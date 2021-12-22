module.exports = (ctx) => ({
    map: { inline: false },
    plugins: [
        require('postcss-import')(),
        require('postcss-preset-env')(),
        require('cssnano')(),
    ],
})