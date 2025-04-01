import globals from "globals";
import pluginJs from "@eslint/js";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    languageOptions: { globals: globals.browser },
    rules: {
      "prettier/prettier": "error", // Enforce Prettier formatting
      "indent": ["error", 2], // Example rule for indentation
      "semi": ["error", "always"], // Example rule for semicolons
    },
    plugins: ["prettier"], // Add Prettier plugin
  },
  pluginJs.configs.recommended,
];