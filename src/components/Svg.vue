<script setup lang="ts">
	import { h, VNode, Text, shallowRef, Fragment, Comment, onMounted } from "vue";

	const props = defineProps<{
		src: string,
		color?: string,
		stroke?: string,
		fill?: string,
		strokeWidth?: string
	}>();

	const source = shallowRef();

	function getAttrs(node: Element) {
		const attrs = {};
		for (const attr of node.attributes)
			attrs[attr.name] = attr.value;
		return attrs;
	}

	function htmlElementToVNode(elem: ChildNode): VNode {
		switch(elem.nodeType){
			default:
				if ((elem as HTMLElement).childNodes.length)
					return h((elem as HTMLElement).tagName, getAttrs((elem as HTMLElement)), htmlToNodes(elem.childNodes));

				return h((elem as HTMLElement).tagName, getAttrs((elem as HTMLElement)), (elem as HTMLElement).innerHTML);
			case 3: // just text
				return h(Text, elem.nodeValue ?? undefined);
			case 7: // <?xml ... ?>
			case 8: // <!-- ... -->
				return h(Comment, elem.nodeValue ?? undefined);
		}
	}

	function htmlToNodes(nodes: NodeListOf<ChildNode>){
		return Array
			.from(nodes)
			.map(node => htmlElementToVNode(node));
	};

	onMounted(async () => {
		const div = document.createElement("div");
		div.innerHTML = await (await fetch(props.src)).text();
		if(props.src.includes("#")){
			const symbol = div.querySelector(`symbol${props.src.slice(props.src.indexOf("#"))}`);
			if(symbol)
				source.value = h("svg", { ...getAttrs(div.querySelector("svg")!), ...getAttrs(symbol) }, htmlToNodes(symbol.childNodes));
		} else
			source.value = h(Fragment, htmlToNodes(div.childNodes));
	});
</script>

<template>
	<div class="svg-container">
		<component :is="source" />
	</div>
</template>

<style scoped>
	div.svg-container {
		display: inline-block;
		width: 1em;
		height: 1em;
		contain: strict;
		box-sizing: content-box !important;
	}

	div.svg-container > :global(svg) {
		display: block;
		height: 100%;
		width: 100%;
		color: v-bind('props.color');
		fill: v-bind('props.fill');
		stroke: v-bind('props.stroke');
		stroke-width: v-bind('props.strokeWidth');
	}
</style>