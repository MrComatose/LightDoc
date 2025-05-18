const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = merge(common, {
  mode: "production",
  output: {
    filename: `bundle-[contenthash].js`, // Use contenthash for better caching in production
    path: path.resolve(__dirname, "../dist/frontend"),
    clean: true, // Clean the output directory before emitting
  },
  optimization: {
    splitChunks: {
      chunks: "all",
      name: "vendors",
    },
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
          },
        },
      }),
      new CssMinimizerPlugin(),
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "styles-[contenthash].css",
    }),
  ],
});
