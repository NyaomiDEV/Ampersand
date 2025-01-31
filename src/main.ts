if(!window.isSecureContext){
	console.error("Cannot continue, this is not a safe environment!");
	document.body.innerHTML = "<h1 style='text-align: center;'>Ampersand cannot run on non-HTTPS environments! We're sorry for the trouble.<br>If you think this is an issue, report it on GitHub.</h1>";
} else {
	await import('./app');
}

export { };
