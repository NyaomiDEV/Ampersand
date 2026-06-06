package moe.ampersand.track.tauriplugin

import android.view.ViewTreeObserver

// This singleton will hold stuff that we also need in MainActivity
object AmpersandSingleton {
    val splashKeeper = ViewTreeObserver.OnPreDrawListener { false }
}