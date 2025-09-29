package moe.ampersand.app.plugin

import android.app.Activity
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Plugin
import app.tauri.plugin.Invoke

import android.content.Intent
import android.webkit.WebView
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import app.tauri.plugin.JSObject
import java.io.File

@InvokeArg
internal class OpenFileArgs {
  lateinit var path: String
}

@InvokeArg
internal class SetCanGoBackArgs {
    var canGoBack: Boolean = false
}

@InvokeArg
internal class BroadcastEventArgs {
    lateinit var payload: String
}

@TauriPlugin
class AmpersandPlugin(private val activity: Activity): Plugin(activity) {
    private val canGoBack = false
    private val backCallback = object : OnBackPressedCallback(canGoBack) {
        override fun handleOnBackPressed() {
            trigger("backbutton", JSObject())
        }
    }

    override fun load(webView: WebView) {
        (activity as AppCompatActivity).onBackPressedDispatcher.addCallback(activity, backCallback)
    }

    @Command
    fun exitApp(invoke: Invoke) {
        activity.finish()
        invoke.resolve()
    }

    @Command
    fun setCanGoBack(invoke: Invoke){
        val args = invoke.parseArgs(SetCanGoBackArgs::class.java)
        backCallback.isEnabled = args.canGoBack
        invoke.resolve()
    }

    @Command
    fun openFile(invoke: Invoke) {
        val args = invoke.parseArgs(OpenFileArgs::class.java)
        try {
            val file = File(args.path)
            val uri = FileProvider.getUriForFile(activity, activity.packageName + ".fileprovider", file)
            val intent = Intent(Intent.ACTION_VIEW)
            intent.setData(uri)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            activity.applicationContext?.startActivity(intent)
            invoke.resolve()
        }catch (e: Exception){
            invoke.reject(e.message)
        }
    }

    @Command
    fun getWebkitVersion(invoke: Invoke) {
        val ret = JSObject()
        ret.put("version", WebView.getCurrentWebViewPackage()?.versionName ?: "")
        invoke.resolve(ret)
    }

    @Command
    fun broadcastEvent(invoke: Invoke) {
        val args = invoke.parseArgs(BroadcastEventArgs::class.java)
        val intent = Intent("moe.ampersand.app.EVENT")
        intent.putExtra("data", args.payload)
        activity.applicationContext?.sendBroadcast(intent)
        invoke.resolve()
    }
}
