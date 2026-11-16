import { EnvValidationError, serverEnv } from "./env";
import { loadRootEnv } from "./load-env";

const files = loadRootEnv();
try {
  const env = serverEnv();
  console.log(`Environment OK (${files.length ? files.join(", ") : "process env only"}).`);
  console.log(
    `  NODE_ENV=${env.NODE_ENV} EMAIL_DRIVER=${env.EMAIL_DRIVER} SMS_DRIVER=${env.SMS_DRIVER}`,
  );
} catch (e) {
  if (e instanceof EnvValidationError) {
    console.error(e.message);
    process.exit(1);
  }
  throw e;
}
