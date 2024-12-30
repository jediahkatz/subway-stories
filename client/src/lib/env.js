export const getEnvVar = (key) =>
  import.meta.env[key] ?? (typeof process !== 'undefined' ? process.env[key] : '');

export const isDev = !!getEnvVar('DEV');
