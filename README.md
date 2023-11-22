<p align="center">
  <a href="https://sentry.io/?utm_source=github&utm_medium=logo" target="_blank">
    <picture>
      <source srcset="https://sentry-brand.storage.googleapis.com/sentry-logo-white.png" media="(prefers-color-scheme: dark)" />
      <source srcset="https://sentry-brand.storage.googleapis.com/sentry-logo-black.png" media="(prefers-color-scheme: light), (prefers-color-scheme: no-preference)" />
      <img src="https://sentry-brand.storage.googleapis.com/sentry-logo-black.png" alt="Sentry" width="280">
    </picture>
  </a>
</p>

_Bad software is everywhere, and we're tired of it. Libapm is on a mission to help developers write better software faster, so we can get back to enjoying technology

# Libapm SDK for React Native


## Requirements

- `react-native >= 0.65.0`

## Features

- RN New Architecture support

## Installation and Usage

To install the package and setup your project:

```sh
npx @libapm1/react-native
```

How to use it:

```javascript
import * as TestApm from "@sentry/react-native";

TestApm.init({
  dsn: "__DSN__",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

TestApm.setTag("myTag", "tag-value");
TestApm.setExtra("myExtra", "extra-value");
TestApm.addBreadcrumb({ message: "test" });

TestApm.captureMessage("Hello TestApm!");
```

