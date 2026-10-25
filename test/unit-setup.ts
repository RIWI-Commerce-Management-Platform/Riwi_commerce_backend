import { Logger } from '@nestjs/common';

// Unit specs exercise failure paths that log on purpose (seed errors, auth
// failures, activity log fallbacks). Silence Nest's logger so real failures
// stand out in the test output.
Logger.overrideLogger(false);
