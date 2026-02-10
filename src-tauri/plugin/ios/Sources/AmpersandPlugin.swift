import SwiftRs
import Tauri
import UIKit
import WebKit

class AmpersandPlugin: Plugin {
  @objc public func dismissSplash(_ invoke: Invoke) {
    invoke.resolve()
  }

  @objc public func openFile(_ invoke: Invoke) {
    invoke.resolve()
  }

  @objc public func broadcastEvent(_ invoke: Invoke) {
    invoke.resolve()
  }

  @objc public func getResourceFileDescriptor(_ invoke: Invoke) {
    invoke.resolve()
  }

  @objc public func listAssets(_ invoke: Invoke) {
    invoke.resolve()
  }
}

@_cdecl("init_plugin_ampersand")
func initPlugin() -> Plugin {
  return AmpersandPlugin()
}
