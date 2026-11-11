
import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
  },
  plugins: [
    ...(config.plugins ?? []),
    [
      'expo-build-properties',
      {
        android: {
          usesCleartextTraffic: /^http:\/\//i.test(
            process.env.EXPO_PUBLIC_API_URL?.trim() ?? '',
          ),
        },
      },
    ],
  ],
});
