
import 'dotenv/config';

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();

export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    googleMapsAndroidConfigurado: Boolean(googleMapsApiKey),
  },
  plugins: [
    ...(config.plugins ?? []),
    [
      'react-native-maps',
      { androidGoogleMapsApiKey: googleMapsApiKey },
    ],
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
