const webpack = require('webpack');
const glob = require('glob');
const path = require('path');
const fs = require('fs');
const merge = require('webpack-merge');

const ROOT_PATH = path.resolve(__dirname);
const MANIFESTS_PATH = path.resolve(ROOT_PATH, 'manifests');
const VENDOR_MANIFEST_PATH = path.resolve(MANIFESTS_PATH, 'vendor-manifest.json');
const VENDOR_MANIFEST = require(VENDOR_MANIFEST_PATH);

const pluginPrefix = '../../graylog-plugin-*/**/';
const pluginConfigPattern = pluginPrefix + 'webpack.config.js';

const pluginConfigs = process.env.disable_plugins == 'true' ? [] : glob.sync(pluginConfigPattern);

process.env.web_src_path = path.resolve(__dirname);

const webpackConfig = require(path.resolve(__dirname, './webpack.config.js'));

pluginConfigs.filter(pluginConfig => {
  // Avoid including webpack configs of dependencies and built files.
  return !pluginConfig.includes('/target/') && !pluginConfig.includes('/node_modules/');
}).forEach(pluginConfig => {
  const packageConfig = path.join(path.dirname(pluginConfig), 'package.json');

  let pluginName;
  if (fs.existsSync(packageConfig)) {
    // If a package.json file exists (should normally be the case) use the package name for pluginName
    const pkg = JSON.parse(fs.readFileSync(packageConfig, 'utf8'));
    pluginName = pkg.name.replace(/\s+/g, '');
  } else {
    // Otherwise just use the directory name of the webpack config file
    pluginName = path.basename(path.dirname(pluginConfig));
  }
  const pluginDir = path.resolve(pluginConfig, '../src/web');
  webpackConfig.entry[pluginName] = pluginDir;
  webpackConfig.resolve.modulesDirectories.unshift(pluginDir);
  webpackConfig.plugins.unshift(new webpack.DllReferencePlugin({ manifest: VENDOR_MANIFEST, context: path.resolve(pluginDir, '../..') }));
});

module.exports = webpackConfig;
