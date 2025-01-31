package moe.ampersand.app

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.webkit.JavascriptInterface
import androidx.core.content.FileProvider
import java.io.File

class AmpersandNative(private var activity: Activity) {

    @JavascriptInterface
    fun exitApp(){
        activity.finish()
    }
    
    @JavascriptInterface
    fun openFile(path: String): Boolean {
        try {
            val file = File(path);
            val uri = FileProvider.getUriForFile(activity, activity.packageName + ".fileprovider", file);
            val intent = Intent(Intent.ACTION_VIEW);
            intent.setData(uri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            activity.applicationContext?.startActivity(intent);
        }catch (e: Exception){
            return false;
        }
        return true;
    }

}