package moe.ampersand.app

import android.os.Build
import android.os.Bundle
import android.view.View
import androidx.activity.enableEdgeToEdge
import moe.ampersand.app.plugin.AmpersandSingleton

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
      if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.S){ 
          this.findViewById<View>(android.R.id.content).viewTreeObserver.addOnPreDrawListener(AmpersandSingleton.splashKeeper)
      }
    super.onCreate(savedInstanceState)
  }
}