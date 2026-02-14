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
      self.manager.viewController?.addChild(controller)
      self.manager.viewController?.view.addSubview(controller.view)
      controller.present(URL(fileURLWithPath: args.path))
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
  var controller: UIDocumentInteractionController!

  func documentInteractionControllerViewControllerForPreview(
    _ controller: UIDocumentInteractionController
  ) -> UIViewController {
    return self
  }

  func present(_ url: URL) {
    controller = UIDocumentInteractionController(url: url)
    controller.delegate = self
    controller.presentPreview(animated: true)
  }

  override func viewDidLoad() {
    super.viewDidLoad()
  }

  func documentInteractionControllerDidEndPreview(_ controller: UIDocumentInteractionController) {
    controller = nil
    self.view.removeFromSuperview()
    self.removeFromParent()
  }
}