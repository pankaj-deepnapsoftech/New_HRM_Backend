import js from "@eslint/js";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"], 
     languageOptions: {
      ecmaVersion: 2022,
     },
    plugins: { js },
    extends: ["js/recommended"],
    rules: {
      "no-console": "warn",
      "no-unused-vars": ["warn", { args: "none" }],
    },
  },
]);