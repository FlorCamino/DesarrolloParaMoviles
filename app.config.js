module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    [
      'expo-build-properties',
      {
        android: {
          usesCleartextTraffic: /^http:\/\//i.test(
            process.env.EXPO_PUBLIC_API_URL?.trim() ?? ''
          ),
        },
      },
    ],
  ],
});
