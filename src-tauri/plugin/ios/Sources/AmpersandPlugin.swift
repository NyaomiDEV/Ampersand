import SwiftRs
import Tauri
import UIKit
import WebKit

class OpenFileArgs: Decodable {
  let path: String
}

class AmpersandPlugin: Plugin {
  @objc public func dismissSplash(_ invoke: Invoke) {
    invoke.resolve()
  }

  @objc public func openFile(_ invoke: Invoke) throws {
    let args = try invoke.parseArgs(OpenFileArgs.self)

    DispatchQueue.main.async {
      let controller = OpenFileController()
      controller.setUrl(URL(fileURLWithPath: args.path))
      self.manager.viewController?.addChild(controller)
      self.manager.viewController?.view.addSubview(controller.view)
      invoke.resolve()
    }
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


class OpenFileController: UIViewController, UIDocumentInteractionControllerDelegate {
  var url: URL!
  var controller: UIDocumentInteractionController!

  func setUrl(_ url: URL) {
    self.url = url
  }

  override func viewDidLoad() {
    super.viewDidLoad()
    controller = UIDocumentInteractionController(url: self.url)
    controller.delegate = self
    if !controller.presentPreview(animated: true) {
      controller.presentOpenInMenu(from: self.view.bounds, in: self.view, animated: true)
    }
  }

  func documentInteractionControllerDidEndPreview(_ controller: UIDocumentInteractionController) {
    self.view.removeFromSuperview()
    self.removeFromParent()
  }

  func documentInteractionControllerDidDismissOpenInMenu(
    _ controller: UIDocumentInteractionController
  ) {
    self.view.removeFromSuperview()
    self.removeFromParent()
  }

  func documentInteractionControllerViewControllerForPreview(
    _ controller: UIDocumentInteractionController
  ) -> UIViewController {
    return self
  }
}