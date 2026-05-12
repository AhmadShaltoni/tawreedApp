const fs = require("fs");
const path = require("path");

const appJson = require("./app.json");

const projectRoot = __dirname;
const iosGoogleServicesFile = "./GoogleService-Info.plist";
const androidGoogleServicesFile = "./google-services.json";

const fileExists = (relativePath) =>
  fs.existsSync(path.join(projectRoot, relativePath));

module.exports = () => {
  const config = JSON.parse(JSON.stringify(appJson.expo));
  const hasIosFirebaseConfig = fileExists(iosGoogleServicesFile);
  const hasAndroidFirebaseConfig = fileExists(androidGoogleServicesFile);
  const hasFirebaseConfig = hasIosFirebaseConfig || hasAndroidFirebaseConfig;

  config.ios = {
    ...config.ios,
    ...(hasIosFirebaseConfig
      ? { googleServicesFile: iosGoogleServicesFile }
      : { googleServicesFile: undefined }),
  };

  config.android = {
    ...config.android,
    ...(hasAndroidFirebaseConfig
      ? { googleServicesFile: androidGoogleServicesFile }
      : { googleServicesFile: undefined }),
  };

  if (!hasFirebaseConfig) {
    config.plugins = config.plugins.filter((plugin) => {
      const pluginName = Array.isArray(plugin) ? plugin[0] : plugin;

      return (
        pluginName !== "@react-native-firebase/app" &&
        pluginName !== "@react-native-firebase/messaging"
      );
    });
  }

  return config;
};
