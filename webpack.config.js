// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/i,
        loader: "css-loader",
        options: {
          modules: true,
        },
      },
    ],
  },
  experiments: {
    topLevelAwait: true,
  },
};
