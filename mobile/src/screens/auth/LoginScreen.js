import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Chrome, WalletCards } from 'lucide-react-native';
import AppScreen from '../../components/common/AppScreen';
import PrimaryButton from '../../components/common/PrimaryButton';
import { useTheme } from '../../store/ThemeContext';
import { useAuth } from '../../store/AuthContext';

let GoogleSigninModule = null;
try {
  GoogleSigninModule = require('@react-native-google-signin/google-signin');
} catch (e) {
  console.warn('GoogleSignin native module is not available in current runtime:', e?.message || e);
}

const GoogleSignin = GoogleSigninModule?.GoogleSignin;
const statusCodes = GoogleSigninModule?.statusCodes || {};
const isErrorWithCode = GoogleSigninModule?.isErrorWithCode || (() => false);

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { colors, shadow } = useTheme();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (GoogleSignin) {
      try {
        const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
        const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
        GoogleSignin.configure({
          webClientId: webClientId || undefined,
          iosClientId: iosClientId || undefined,
          offlineAccess: false,
        });
      } catch (err) {
        console.warn('GoogleSignin.configure failed:', err?.message || err);
      }
    }
  }, []);

  const handleGoogleSignIn = async () => {
    if (!GoogleSignin) {
      Alert.alert(
        'Native Development Build Required',
        'Google Sign-In relies on native code (@react-native-google-signin/google-signin) and is not supported in Expo Go. Please run the app using a development build (npx expo run:android / npx expo run:ios or EAS Build).'
      );
      return;
    }

    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Clear any prior native session so Google displays the account chooser
      try {
        await GoogleSignin.signOut();
      } catch {
        // Ignore if no prior session was active
      }

      const response = await GoogleSignin.signIn();

      // Support v13+ response.data.idToken as well as legacy response.idToken
      const idToken = response?.data?.idToken || response?.idToken;

      if (!idToken) {
        Alert.alert(
          'Google Sign-In Failed',
          'Google did not return an identity token. Please verify that EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID / EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID is configured properly.'
        );
        return;
      }

      const result = await signIn(idToken);
      if (!result.success) {
        Alert.alert('Could Not Sign In', result.message);
      }
    } catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            // User cancelled the login flow
            break;
          case statusCodes.IN_PROGRESS:
            // Operation (e.g. sign in) is already in progress
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert(
              'Google Play Services',
              'Google Play Services is not available or outdated on this device.'
            );
            break;
          default:
            Alert.alert(
              'Google Sign-In Error',
              error.message || 'An error occurred during Google Sign-In.'
            );
        }
      } else {
        Alert.alert('Sign-In Error', error?.message || 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen style={styles.screen}>
      <View style={styles.top}>
        <View style={[styles.logo, { backgroundColor: colors.primary }]}>
          <WalletCards size={34} color="#FFFFFF" strokeWidth={2.3} />
        </View>
        <Text style={[styles.brand, { color: colors.text }]}>FinFlow</Text>
        <Text style={[styles.tagline, { color: colors.muted }]}>A calmer, clearer way to follow your money.</Text>
      </View>
      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border, ...shadow }]}>
        <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
        <Text style={[styles.detail, { color: colors.muted }]}>
          Sign in securely to view your budgets, savings, and recent spending.
        </Text>
        <PrimaryButton
          title="Continue with Google"
          onPress={handleGoogleSignIn}
          loading={loading}
          icon={Chrome}
          style={{ marginTop: 26 }}
        />
        <Text style={[styles.privacy, { color: colors.muted }]}>
          FinFlow uses Google only to verify your identity. Your financial data stays in your account.
        </Text>
      </View>
      <Text style={[styles.footer, { color: colors.muted }]}>Personal finance, in flow.</Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 24,
    justifyContent: 'space-between',
  },
  top: {
    marginTop: 80,
    alignItems: 'center',
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 18,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
    lineHeight: 23,
  },
  panel: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 22,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
  },
  detail: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  privacy: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 18,
  },
  footer: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
});
