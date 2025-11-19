# Troubleshooting Guide

## Common Issues and Solutions

### "require is not defined" Error on Web

**Issue:** When running `npm start` and opening in web browser, you see:
```
Uncaught ReferenceError: require is not defined
at ./node_modules/@react-navigation/elements/lib/module/useFrameSize.js
```

**Root Cause:** React Navigation v7 uses `require()` to dynamically load `SafeAreaListener`, which doesn't work in web browsers. This is a known compatibility issue between React Navigation and web environments.

**Why This Happens:**
- React Navigation's `@react-navigation/elements` package has code designed for React Native (mobile)
- The `require()` function exists in Node.js and React Native but not in browsers
- Webpack can't properly polyfill this specific dynamic require usage

**Solution:** This app is designed for **mobile devices** where it works perfectly. For web support, you would need to either:
1. Downgrade to React Navigation v6 (better web support)
2. Use a different navigation library for web (React Router)
3. Wait for React Navigation v7 web compatibility improvements

**Recommended: Use the app on mobile devices where it works flawlessly:**

1. **Install Expo Go on your phone:**
   - iOS: [Download from App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Download from Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Start the app:**
   ```bash
   npm start
   ```

3. **Scan the QR code:**
   - On iOS: Open Camera app and scan the QR code
   - On Android: Open Expo Go app and scan the QR code

4. **The app will load on your phone!**

### Clear Cache and Restart

If you're experiencing issues, try clearing the cache:

```bash
# Clear Expo cache
rm -rf .expo node_modules/.cache

# Restart with cache cleared
npm start --clear
```

### Port Already in Use

**Issue:** `Port 8081 is running this app in another window`

**Solution:**
```bash
# Kill the process using port 8081
lsof -ti:8081 | xargs kill -9

# Or use a different port
npm start -- --port 8082
```

### Cannot Connect to Server

**Issue:** Mobile app shows "Error fetching data" or cannot connect to backend

**Solutions:**

1. **Make sure backend server is running:**
   ```bash
   cd server
   npm start
   ```

2. **Update the API URL in `screens/HomeScreen.js`:**
   ```javascript
   export const API_URL = 'http://YOUR_COMPUTER_IP:3000/api/airquality';
   ```
   
   Find your computer's IP:
   - Mac: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - Windows: `ipconfig`
   - Linux: `ip addr show`

3. **Ensure phone and computer are on the same WiFi network**

### Hedera Integration Issues

**Issue:** "Failed to create topic" or "Failed to submit data"

**Solutions:**

1. **Verify backend server is running:**
   ```bash
   cd server
   npm start
   ```

2. **Check Hedera credentials:**
   - Account ID format: `0.0.xxxxx`
   - Private Key starts with: `302e020100...`
   - Get free testnet account at: https://portal.hedera.com

3. **Check server logs for detailed errors**

4. **Test backend directly:**
   ```bash
   cd server
   node test-hedera.js
   ```

### Module Not Found Errors

**Issue:** `Module not found: Can't resolve '@react-navigation/...'`

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Expo Go App Not Loading

**Issue:** QR code scanned but app doesn't load

**Solutions:**

1. **Make sure you're on the same network**
2. **Try tunnel mode:**
   ```bash
   npm start -- --tunnel
   ```
3. **Update Expo Go app to latest version**
4. **Restart Expo dev server:**
   ```bash
   npm start --clear
   ```

## Platform-Specific Notes

### iOS
- Camera app can scan QR codes directly
- May need to allow network permissions
- Works best on iOS 13+

### Android
- Use Expo Go app to scan QR codes
- May need to allow network permissions
- Works best on Android 8+

### Web (Not Recommended)
- Web version has compatibility issues
- Use mobile devices for best experience
- If you must use web, expect errors with navigation

## Getting Help

If you're still experiencing issues:

1. Check the [Expo documentation](https://docs.expo.dev/)
2. Check the [React Navigation documentation](https://reactnavigation.org/)
3. Review server logs for backend issues
4. Check that all dependencies are installed correctly

## Recommended Setup

For the best experience:

1. ✅ Use a physical mobile device (iOS or Android)
2. ✅ Install Expo Go app
3. ✅ Connect to same WiFi as your development computer
4. ✅ Run backend server before starting mobile app
5. ✅ Use correct IP address in API_URL configuration

