// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  kcClientID: 'todoapp-client', // из настроек KeyCloak
  kcBaseURL: 'https://localhost:8443/realms/todoapp-realm/protocol/openid-connect', // базовый URL KeyCloak
  clientLoginURL: 'https://localhost:4200', // текущий frontend
  bffURI: 'https://localhost:8902/bff'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
