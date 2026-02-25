import Tauri
import UIKit

class OpenFileArgs: Decodable {
    let path: String
}

class AmpersandPlugin: Plugin {

    @objc public func dismissSplash(_ invoke: Invoke) {
        invoke.resolve()
    }

    @objc public func openFile(_ invoke: Invoke) throws {
        let args = try invoke.parseArgs(OpenFileArgs.self)
        let fileURL = URL(fileURLWithPath: args.path)
        invoke.resolve()

        DispatchQueue.main.async {
            var previewController = UIDocumentInteractionController()
            previewController.url = fileURL
            let delegate = PreviewControllerDelegate(owner: self.manager.viewController!)
            previewController.delegate = delegate
            previewController.presentPreview(animated: true)
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

class PreviewControllerDelegate: NSObject, UIDocumentInteractionControllerDelegate {
    var owner: UIViewController

    init(owner: UIViewController) {
        self.owner = owner
    }

    func documentInteractionControllerViewControllerForPreview(
        _ controller: UIDocumentInteractionController
    ) -> UIViewController {
        return self.owner
    }
}

@_cdecl("init_plugin_ampersand")
func initPlugin() -> Plugin {
    return AmpersandPlugin()
}
