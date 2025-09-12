import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default defineConfig([
	js.configs.recommended,
	tseslint.configs.recommendedTypeChecked,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname
			}
		},
		rules: {
			"arrow-body-style": [
				"error",
				"as-needed"
			],
			"class-methods-use-this": 1,
			"eqeqeq": [
				"error",
				"smart"
			],
			"dot-notation": [
				"error",
				{
					"allowKeywords": true
				}
			],
			"func-call-spacing": [
				"error",
				"never"
			],
			"func-names": [
				"error",
				"as-needed"
			],
			"prefer-arrow-callback": [
				"error",
				{
					"allowNamedFunctions": true,
					"allowUnboundThis": true
				}
			],
			"func-style": [
				"error",
				"declaration",
				{
					"allowArrowFunctions": true
				}
			],
			"indent": [
				"error",
				"tab",
				{
					"SwitchCase": 1,
					"VariableDeclarator": 1,
					"MemberExpression": 1,
					"FunctionDeclaration": {
						"parameters": 1
					},
					"CallExpression": {
						"arguments": 1
					},
					"ArrayExpression": 1,
					"ObjectExpression": 1,
					"ImportDeclaration": 1,
					"flatTernaryExpressions": true,
					"offsetTernaryExpressions": true,
					"ignoreComments": false
				}
			],
			"linebreak-style": [
				"error",
				"unix"
			],
			"quotes": [
				"error",
				"double"
			],
			"semi": [
				"error",
				"always"
			],
			"curly": [
				"error",
				"multi-or-nest"
			],
			"no-case-declarations": "off",
			"no-control-regex": "off",
			"@typescript-eslint/no-floating-promises": "error",
			"@typescript-eslint/no-unsafe-assignment": "off",
			"@typescript-eslint/no-unsafe-argument": "off",
			"@typescript-eslint/no-unsafe-member-access": "off"
		}
	}
]);