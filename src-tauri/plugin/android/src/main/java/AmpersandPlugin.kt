package moe.ampersand.app.plugin

import android.app.Activity

import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Plugin
import app.tauri.plugin.Invoke

import android.content.Intent
import androidx.core.content.FileProvider
import java.io.File

@InvokeArg
internal class OpenFileArgs {
  lateinit var path: String
}

@TauriPlugin
class AmpersandPlugin(private val activity: Activity): Plugin(activity) {
    @Command
    fun exitApp(invoke: Invoke) {
        activity.finish()
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
