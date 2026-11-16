import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App)
// in Expo Go and registers appName in standalone builds, while initializing the
// Expo runtime polyfills and TurboModules to prevent [runtime not ready].
registerRootComponent(App);
