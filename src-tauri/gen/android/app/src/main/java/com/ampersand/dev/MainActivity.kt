package com.ampersand.dev

import android.webkit.WebView
import android.annotation.SuppressLint

class MainActivity : TauriActivity() {
  private lateinit var wv: WebView
  
  override fun onWebViewCreate(webView: WebView) {
    wv = webView
  }
  
  @SuppressLint("MissingSuperCall", "SetTextI18n")
  @Deprecated("")
  override fun onBackPressed() {
    wv.evaluateJavascript(/* script = */ """
        document.dispatchEvent(new Event('backbutton'))
    """.trimIndent()) { result ->
      if (result == "false") {
        super.onBackPressed();
      }
    }
  }
}