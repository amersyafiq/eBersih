import * as SecureStore from 'expo-secure-store';

export async function saveSession(
  accessToken: string,
  refreshToken: string,
  role: string
) {
  await Promise.all([
    SecureStore.setItemAsync('access_token', accessToken),
    SecureStore.setItemAsync('refresh_token', refreshToken),
    SecureStore.setItemAsync('role', role),
  ]);
}

export async function getAccessToken() {
  return SecureStore.getItemAsync('access_token');
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync('refresh_token');
}

export async function getUserRole() {
  return SecureStore.getItemAsync('role');
}

export async function clearSession() {
  await Promise.all([
    SecureStore.deleteItemAsync('access_token'),
    SecureStore.deleteItemAsync('refresh_token'),
    SecureStore.deleteItemAsync('role'),
  ]);
}
