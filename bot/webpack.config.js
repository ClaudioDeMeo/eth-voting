'use strict';

const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    entry: './app.js',

    output: {
        filename: 'app.min.js',
        path: path.resolve(__dirname)
    },

    target: 'node',
    externals: [
        nodeExternals()
    ],

    devtool: 'source-map',
    plugins: [
        new UglifyJSPlugin({
            sourceMap: true,
        }),
    ],

};
