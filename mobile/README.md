# FinFlow Mobile

FinFlow is an Expo React Native application for Android and iOS. It uses Expo SDK 57, React Native 0.86, native Google Sign-In, Expo Secure Store, React Navigation, Axios, and TanStack React Query.

## Prerequisites

- Node.js 22 LTS (recommended; the project permits Node >=20.19 <25)
- npm 10 or newer
- Android Studio with an Android SDK, platform tools, and an emulator, or a USB-debugged Android device
- Java installed through Android Studio's supported setup
- An Expo account for EAS cloud builds
- A macOS machine with Xcode only when building iOS locally

Check the local toolchain:

~~~powershell
node --version
npm --version
npx expo --version
~~~

## Install

~~~powershell
cd D:\expense-manager\mobile
npm ci
~~~

Use npm install only when intentionally changing dependencies. Keep the lockfile in sync with package.json.

## Environment Configuration

Create the local environment file:

~~~powershell
Copy-Item .env.example .env
~~~

Set the following values in .env:

~~~env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:5000/api
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-google-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-google-android-client-id.apps.googleusercontent.com
~~~

For a physical device, use the development computer's LAN IP address rather than localhost. The device and API server must be reachable on the same network.

For production, EXPO_PUBLIC_API_BASE_URL must be an HTTPS endpoint.

> Any value prefixed with EXPO_PUBLIC_ is embedded in the client bundle. Never put passwords, private API keys, database URLs, JWT signing keys, or other server secrets in this file.

## Google Sign-In Setup

The app uses @react-native-google-signin/google-signin, a native module. It does not run in standard Expo Go. Use a development client or a release build.

Before building:

1. Create Google OAuth clients for Web, Android, and iOS in Google Cloud Console.
2. Set the public client IDs in .env and the corresponding EAS environments.
3. Configure the Android OAuth client with package ID com.finflow.mobile.
4. Add the SHA-1 certificate fingerprint for the debug key during local development and the EAS/production signing key for release builds.
5. Replace the placeholder iosUrlScheme in app.json with the actual reversed iOS client ID, for example com.googleusercontent.apps.1234567890-abcdef.
6. Configure the backend to validate the ID-token issuer, audience, signature, and expiry.

## Validate the Project

Run these checks before creating a build:

~~~powershell
npx expo-doctor
npm run lint
npx expo export
~~~

Use Expo's package resolver when updating Expo-managed dependencies:

~~~powershell
npx expo install --fix
~~~

## Local Android Development Build

The first native build, any native dependency change, app configuration change, or Expo SDK upgrade requires a native rebuild:

~~~powershell
npx expo prebuild --clean
npm run android
~~~

To install on a chosen emulator or connected device:

~~~powershell
npx expo run:android --device
~~~

After the native development client is installed, JavaScript-only changes do not need a rebuild:

~~~powershell
npm run start
~~~

Open the installed FinFlow development client, or press a in the Expo terminal to launch Android.

For a release-mode behavior check on Android:

~~~powershell
npx expo run:android --variant release
~~~

This local release build is useful for testing, but it is not the signed artifact for store submission.

## Local iOS Development Build

Run these commands only on macOS with Xcode installed:

~~~bash
npx expo prebuild --clean
npm run ios
~~~

To test release behavior:

~~~bash
npx expo run:ios --configuration Release
~~~

## EAS Build Setup

Install and authenticate EAS CLI:

~~~powershell
npm install --global eas-cli
eas login
eas whoami
~~~

This repository already has an EAS project ID and build profiles in eas.json:

| Profile | Purpose | Output |
| --- | --- | --- |
| development | Native development client | Internal distribution |
| preview | Internal tester build | Internal distribution |
| production | Final Android distribution | APK |

Set the public runtime variables in the correct EAS environment before building. Do not upload server secrets.

## Test and Internal APK Builds

Create a cloud development build:

~~~powershell
eas build --platform android --profile development
~~~

Create an internal preview build:

~~~powershell
eas build --platform android --profile preview
~~~

Create the configured final installable APK:

~~~powershell
eas build --platform android --profile production
~~~

Download and install a finished Android build on an emulator:

~~~powershell
eas build:run --platform android --latest
~~~

For a connected physical device, download the APK from the EAS build page and install it, or use:

~~~powershell
adb install path\to\finflow.apk
~~~

## Google Play Production Build

Google Play requires an Android App Bundle (.aab), not an APK.

The current production profile in eas.json has android.buildType: apk, which is appropriate for direct distribution but cannot be submitted to Google Play.

Before a Play Store build, change the production profile to:

~~~json
{
  "production": {
    "autoIncrement": true,
    "android": {
      "buildType": "app-bundle"
    }
  }
}
~~~

Then build and submit:

~~~powershell
eas build --platform android --profile production
eas submit --platform android --latest
~~~

EAS can generate and manage the Android signing key. Do not use the debug keystore for a distributed production app.

## iOS EAS Builds

Build an internal iOS tester artifact:

~~~powershell
eas build --platform ios --profile preview
~~~

Build and submit an App Store artifact:

~~~powershell
eas build --platform ios --profile production
eas submit --platform ios --latest
~~~

An Apple Developer Program membership is required for signed iOS distribution.

## Native Project Workflow

The project currently contains a generated android directory. When using Expo Continuous Native Generation, regenerate native projects after native changes:

~~~powershell
npx expo prebuild --clean
~~~

This command replaces generated native files. Move deliberate native customizations into app.json, app.config.js, or a config plugin before running it.

## Useful Commands

~~~powershell
# Start Metro
npm run start

# Android/iOS native development builds
npm run android
npm run ios

# Web preview
npm run web

# Static checks
npm run lint
npx expo-doctor

# Clear Metro cache
npx expo start --clear

# Align Expo SDK packages
npx expo install --fix

# Regenerate native projects
npx expo prebuild --clean
~~~

## Security Checklist

- Keep .env out of source control.
- Use HTTPS for production API traffic.
- Store access and refresh tokens only with Expo Secure Store.
- Clear authentication tokens and server-data cache during logout.
- Validate all Google ID tokens on the backend.
- Use EAS-managed signing credentials or securely managed organization-owned credentials.
