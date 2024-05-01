export function getMode(): "ios" | "md" {
	if (typeof (window as any) !== "undefined") {
		const Ionic = (window as any).Ionic;
		if (Ionic && Ionic.config) {
			return Ionic.config.get("mode");
		}
	}
	return "md";
}

export function isIOSMode(): boolean {
	return getMode() === "ios";
}

export function getFiles(contentType?: string, multiple?: boolean): Promise<File[]> {
	return new Promise(resolve => {
		const i = document.createElement("input");
		i.type = "file";
		if(multiple)
			i.multiple = multiple;
		if(contentType)
			i.accept = contentType;

		i.onchange = async () => {
			if (!i.files) return resolve([]);

			const arr: File[] = [];

			for(const file of i.files){
				arr.push(file);
			}

			resolve(arr);
		};

		i.click();

	});
}