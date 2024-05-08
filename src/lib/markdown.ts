import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

export function getMarkdownFor(text: string) {
	return unified()
		.use(remarkParse)
		.use(remarkRehype)
		.use(rehypeStringify)
		.processSync(text).toString()
}