package moe.ampersand.app

import android.webkit.WebView
import android.os.Bundle
import androidx.activity.OnBackPressedCallback
import com.google.android.material.color.DynamicColors

class MainActivity : TauriActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        DynamicColors.applyToActivityIfAvailable(this)
    }

    override fun onWebViewCreate(webView: WebView) {
        onBackPressedDispatcher.addCallback(this, object: OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                webView.evaluateJavascript("document.dispatchEvent(new Event('backbutton'))") { _ -> }
            }
        })
    }
}