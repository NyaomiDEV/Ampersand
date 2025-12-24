package moe.ampersand.app.plugin

import android.app.Activity
import android.content.res.AssetManager.ACCESS_BUFFER
import android.content.Intent
import android.webkit.WebView
import android.os.ParcelFileDescriptor
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider

import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin

import app.tauri.plugin.Plugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.JSArray

import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.io.InputStream
import java.io.OutputStream

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

@InvokeArg
internal class GetFileDescriptorArgs {
    lateinit var path: String
    lateinit var mode: String
}

@InvokeArg
internal class ListAssetsArgs {
    lateinit var path: String
}

@TauriPlugin
class AmpersandPlugin(private val activity: Activity): Plugin(activity) {
    private val backCallback = object : OnBackPressedCallback(false) {
        override fun handleOnBackPressed() {
            trigger("backbutton", JSObject())
        }
    }

    override fun load(webView: WebView) {
        (activity as AppCompatActivity).onBackPressedDispatcher.addCallback(activity, backCallback)
    }

    @Command
    fun exitApp(invoke: Invoke) {
        invoke.resolve()
        activity.finish()
    }

    @Command
    fun setCanGoBack(invoke: Invoke) {
        val args = invoke.parseArgs(SetCanGoBackArgs::class.java)
        invoke.resolve()
        backCallback.isEnabled = args.canGoBack
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

    @Command
    fun getResourceFileDescriptor(invoke: Invoke) {
        val args = invoke.parseArgs(GetFileDescriptorArgs::class.java)
        val ret = JSObject()
        try {
            val fd = activity.assets.openFd(args.path).parcelFileDescriptor?.detachFd()
            ret.put("fd", fd)
        } catch (e: IOException) {
            val cacheFile = File(activity.cacheDir, "_assets/${args.path}")
            cacheFile.parentFile?.mkdirs()
            val input = activity.assets.open(args.path, ACCESS_BUFFER)
            input.use(fun(input) {
                val output = FileOutputStream(cacheFile, false)
                output.use(fun(output){
                    val buf = ByteArray(1024)
                    var len: Int
                    while ((input.read(buf).also { len = it }) > 0) {
                        output.write(buf, 0, len)
                    }
                })
            })
            val fd = ParcelFileDescriptor.open(cacheFile, ParcelFileDescriptor.parseMode(args.mode)).detachFd()
            ret.put("fd", fd)
        }
        invoke.resolve(ret)
    }

    @Command
    fun listAssets(invoke: Invoke) {
        val args = invoke.parseArgs(ListAssetsArgs::class.java)
        val ret = JSObject()

        try{
            val arr = JSArray(activity.assets.list(args.path))
            ret.put("files", arr)
            invoke.resolve(ret)
        }catch(e: IOException){
            invoke.reject(e.message)
        }
    }

}
