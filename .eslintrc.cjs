// .eslintrc.cjs
/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["next/core-web-vitals"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  rules: {
    // Prevent build from failing if a file uses eslint-disable for this rule.
    "@typescript-eslint/no-explicit-any": "off",
  },
};

rules: {
  "@typescript-eslint/no-explicit-any": "off",
  "@next/next/no-img-element": "off",
},
