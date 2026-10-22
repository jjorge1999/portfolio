import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';

// Hydration reuses the prerendered DOM. Event replay (withEventReplay) is left off on purpose: in Angular 21.2
// it keeps registering every element that gets a listener for the life of the app, so cards and buttons
// re-created on a view or filter change could never be garbage-collected.
export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideClientHydration()],
};
