import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

export function getMarkdownFor(text: string) {
	return unified()
		// @ts-expect-error
		.use(remarkParse)
		.use(remarkRehype)
		// @ts-expect-error
		.use(rehypeStringify)
		.processSync(text).toString()
}