import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = TikoZapBridgeViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}

class TikoZapBridgeViewController: CAPBridgeViewController {

    override func viewSafeAreaInsetsDidChange() {
    super.viewSafeAreaInsetsDidChange()

    let top = view.safeAreaInsets.top
    let bottom = view.safeAreaInsets.bottom

    print("TikoZap injecting safe area:", top, bottom, webView?.url?.absoluteString ?? "no URL")

    let javascript = """
    document.documentElement.style.setProperty('--tz-native-safe-top', '\(top)px');
    document.documentElement.style.setProperty('--tz-native-safe-bottom', '\(bottom)px');
    """

    webView?.evaluateJavaScript(javascript)
}

    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(TikoZapNavigationPlugin())
        bridge?.registerPluginInstance(TikoZapStoreKitPlugin())
    }
}
