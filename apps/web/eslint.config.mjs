import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import base from "@pos/config/eslint";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  // Next first, so the shared typescript-eslint parser below takes precedence.
  ...compat.extends("next/core-web-vitals"),
  ...base,
  {
    rules: {
      // Server-only secrets must never be imported from client components.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/supabase/admin",
              message: "Admin (secret key) client is server-only. Import it only from server code.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/**/actions.ts", "src/lib/**/*.server.ts", "src/server/**/*.ts"],
    rules: { "no-restricted-imports": "off" },
  },
];

export default config;
