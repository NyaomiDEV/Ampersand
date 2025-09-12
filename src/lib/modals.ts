import { Directive, reactive, VNode } from "vue";
import { setModalCanGoBack } from "./util/backbutton";

const renderArray = reactive<VNode[]>([]);

export const modalEvents = new EventTarget();

const modalDirective: Directive = {
	created(el, binding, vnode) {
		modalEvents.dispatchEvent(new CustomEvent("created", {
			detail: { el, vnode, originalVnode: binding.value.originalVnode }
		}));
	},
	beforeMount(el, binding, vnode) {
		modalEvents.dispatchEvent(new CustomEvent("beforeMount", {
			detail: { el, vnode, originalVnode: binding.value.originalVnode }
		}));
	},
	mounted(el, binding, vnode) {
		modalEvents.dispatchEvent(new CustomEvent("mounted", {
			detail: { el, vnode, originalVnode: binding.value.originalVnode }
		}));
	},
	beforeUpdate(el, binding, vnode, prevVnode) {
		modalEvents.dispatchEvent(new CustomEvent("beforeUpdate", {
			detail: { el, vnode, prevVnode, originalVnode: binding.value.originalVnode }
		}));
	},
	updated(el, binding, vnode, prevVnode) {
		modalEvents.dispatchEvent(new CustomEvent("updated", {
			detail: { el, vnode, prevVnode, originalVnode: binding.value.originalVnode }
		}));
	},
	beforeUnmount(el, binding, vnode) {
		modalEvents.dispatchEvent(new CustomEvent("beforeUnmount", {
			detail: { el, vnode, originalVnode: binding.value.originalVnode }
		}));
	},
	unmounted(el, binding, vnode) {
		modalEvents.dispatchEvent(new CustomEvent("unmounted", {
			detail: { el, vnode, originalVnode: binding.value.originalVnode }
		}));
	}
};

export function useModalContainer(){
	return { renderArray, modalDirective };
}

export async function addModal(vnode: VNode): Promise<{el: HTMLElement, vnode: VNode}> {
	renderArray.push(vnode);
	await setModalCanGoBack(renderArray.length > 0);

	return new Promise(resolve => {
		function cb(evt) {
			if (evt.detail.originalVnode === vnode) {
				resolve({ el: evt.detail.el, vnode: evt.detail.vnode });
				modalEvents.removeEventListener("mounted", cb);
			}
		}
		modalEvents.addEventListener("mounted", cb);
	});
}

export async function removeModal(vnode: VNode){
	const index = renderArray.indexOf(vnode);
	if(index > -1){
		renderArray.splice(
			index,
			1
		);
	}

	await setModalCanGoBack(renderArray.length > 0);
}