const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");

const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = merge(common, {
  mode: "development",
  devServer: {
    static: {
      directory: "./dist",
    },
    port: 8081,
    open: true, // Automatically open the browser
    historyApiFallback: true,
  },
  devtool: "inline-source-map", // For better debugging,
  plugins: [
    new MiniCssExtractPlugin({
      filename: "styles.css",
    }),
  ],
});
