module.exports = {
  presets: ['@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
          '@/components': './src/components',
          '@/screens': './src/screens',
          '@/services': './src/services',
          '@/contexts': './src/contexts',
          '@/hooks': './src/hooks',
          '@/types': './src/types',
          '@/navigation': './src/navigation',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};