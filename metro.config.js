const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// llama.rn a un point dans son nom, ce qui peut perturber la résolution Haste.
// On force la résolution via extraNodeModules.
config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    'llama.rn': path.resolve(__dirname, 'node_modules/llama.rn'),
};

module.exports = config;
