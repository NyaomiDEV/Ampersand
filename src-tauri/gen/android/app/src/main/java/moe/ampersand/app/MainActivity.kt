package moe.ampersand.app

import android.webkit.WebView
import android.annotation.SuppressLint

class MainActivity : TauriActivity() {
    private lateinit var wv: WebView
    
    override fun onWebViewCreate(webView: WebView) { 
        wv = webView
        wv.addJavascriptInterface(AmpersandNative(this), "AmpersandNative");
    }
    @SuppressLint("MissingSuperCall")
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        wv.evaluateJavascript("document.dispatchEvent(new Event('backbutton'))".trimIndent()) { _ -> }
    }
}