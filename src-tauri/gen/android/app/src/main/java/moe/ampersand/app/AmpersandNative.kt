package moe.ampersand.app

import android.app.Activity
import android.webkit.JavascriptInterface

class AmpersandNative(activity: Activity) {
    private var activity: Activity

    init {
        this.activity = activity
    }
    
    @JavascriptInterface
    fun exitApp(){
        activity.finish()
    }
}