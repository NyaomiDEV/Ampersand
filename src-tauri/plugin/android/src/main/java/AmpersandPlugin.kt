package moe.ampersand.app.plugin

import android.app.Activity

import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Plugin
import app.tauri.plugin.Invoke

import android.content.Intent
import android.window.OnBackInvokedCallback
import android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT
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

@TauriPlugin
class AmpersandPlugin(private val activity: Activity): Plugin(activity) {
    private val backCallback = OnBackInvokedCallback { trigger("backbutton", JSObject()) }

    @Command
    fun exitApp(invoke: Invoke) {
        activity.finish()
        invoke.resolve()
    }

    @Command
    fun setCanGoBack(invoke: Invoke){
        val args = invoke.parseArgs(SetCanGoBackArgs::class.java)
        if(args.canGoBack) {
            activity.onBackInvokedDispatcher.registerOnBackInvokedCallback(PRIORITY_DEFAULT, backCallback)
        } else {
            activity.onBackInvokedDispatcher.unregisterOnBackInvokedCallback(backCallback)
        }
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
}
