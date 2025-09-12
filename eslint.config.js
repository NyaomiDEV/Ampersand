import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import vue from "eslint-plugin-vue";
import globals from "globals";
import stylistic from "@stylistic/eslint-plugin"

export default defineConfig([
	js.configs.recommended,
	tseslint.configs.recommendedTypeChecked,
	vue.configs["flat/recommended"],
	{
		files: ["src/**/*.ts", "src/**/*.vue"],
		languageOptions: {
			sourceType: "module",
			globals: globals.browser,
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
				parser: tseslint.parser,
				extraFileExtensions: [".vue"]
			}
		},
		plugins: {
			"@stylistic": stylistic
		},
		rules: {
			"no-unused-vars": "off",
			"no-case-declarations": "off",
			"no-control-regex": "off",
			"arrow-body-style": ["error", "as-needed"],
			"class-methods-use-this": 1,
			"eqeqeq": ["error", "smart"],
			"dot-notation": ["error", { allowKeywords: true }],
			"func-names": ["error", "as-needed"],
			"prefer-arrow-callback": ["error", {
				allowNamedFunctions: true,
				allowUnboundThis: true
			}],
			"func-style": ["error", "declaration", {
				allowArrowFunctions: true
			}],
			"curly": ["error", "multi-or-nest"],
			"@stylistic/function-call-spacing": ["error", "never"],
			"@stylistic/indent": ["error", "tab", {
				SwitchCase: 1,
				VariableDeclarator: 1,
				MemberExpression: 1,
				FunctionDeclaration: {
					parameters: 1
				},
				CallExpression: {
					arguments: 1
				},
				ArrayExpression: 1,
				ObjectExpression: 1,
				ImportDeclaration: 1,
				flatTernaryExpressions: true,
				offsetTernaryExpressions: true,
				ignoreComments: false
			}],
			"@stylistic/linebreak-style": ["error", "unix"],
			"@stylistic/quotes": ["error", "double"],
			"@stylistic/semi": ["error", "always"],
			"@typescript-eslint/no-floating-promises": "error",
			"@typescript-eslint/no-unsafe-assignment": "off",
			"@typescript-eslint/no-unsafe-argument": "off",
			"@typescript-eslint/no-unsafe-member-access": "off",
			"@typescript-eslint/no-unused-vars": ["warn", {
				args: "all",
				argsIgnorePattern: "^_",
				caughtErrors: "all",
				caughtErrorsIgnorePattern: "^_",
				destructuredArrayIgnorePattern: "^_",
				varsIgnorePattern: "^_",
				ignoreRestSiblings: true
			}],
			"vue/html-indent": ["warn", "tab", {}],
			"vue/attribute-hyphenation": ["error", "always"],
			"vue/v-on-event-hyphenation": ["error", "always"],
			"vue/max-attributes-per-line": ["error", {
				singleline: 3,
				multiline: 1
			}],
			"vue/first-attribute-linebreak": ["error", {
				singleline: "beside",
				multiline: "below"
			}],
			"vue/script-indent": ["error", "tab", {
				baseIndent: 1,
				switchCase: 1,
				ignores: []
			}],
			"vue/singleline-html-element-content-newline": "off",
			"vue/multiline-html-element-content-newline": ["error", {
				allowEmptyLines: true
			}],
			"vue/multi-word-component-names": "off",
			"vue/no-deprecated-slot-attribute": "off",
			"vue/html-self-closing": ["error", {
				html: {
					void: "always"
				}
			}]
		}
	},
	{
		files: ["src/**/*.vue"],
		rules: {
			"@stylistic/indent": "off",
		}
	}
]);