package com.ampersand.dev

import android.webkit.WebView
import android.annotation.SuppressLint

class MainActivity : TauriActivity() {
    private lateinit var wv: WebView
    
    override fun onWebViewCreate(webView: WebView) { 
        wv = webView 
    }
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (!wv.canGoBack())
            super.onBackPressed();
        else {
            wv.evaluateJavascript("document.dispatchEvent(new Event('backbutton'))".trimIndent()) { result ->
                if (result == "false") super.onBackPressed();
            }
        }
    }
}