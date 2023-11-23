
_Bad software is everywhere, and we're tired of it. Libapm is on a mission to help developers write better software faster, so we can get back to enjoying technology

# Libapm SDK for React Native


## Requirements

- `react-native >= 0.65.0`

## Features

- RN New Architecture support

## Installation and Usage

To install the package and setup your project:

```sh
npm install @libapm1/react-native
```

How to use it:

```javascript
import * as TestApm from "@libapm1/react-native";

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

