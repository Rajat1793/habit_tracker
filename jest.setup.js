// Jest setup: mock native modules that pure-logic tests pull in transitively.
// AsyncStorage has no native binding under Node, so we swap in its official mock.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
