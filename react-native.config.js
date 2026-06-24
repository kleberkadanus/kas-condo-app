module.exports = {
  dependencies: {
    'react-native-sip2': {
      platforms: {
        android: {
          sourceDir: '../node_modules/react-native-sip2/android',
          packageImportPath: 'import one.telefon.sip2.PjSipModulePackage;',
          packageInstance: 'new PjSipModulePackage()',
        },
        ios: null,
      },
    },
  },
};
