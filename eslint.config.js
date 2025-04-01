import globals from "globals";
import pluginJs from "@eslint/js";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    languageOptions: { globals: globals.browser },
    rules: {
      "prettier/prettier": "error",
      "indent": ["error", 2],
      "semi": ["error", "always"],
    },
    plugins: ["prettier"],
  },
  pluginJs.configs.recommended,
];