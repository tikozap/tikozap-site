import Foundation
import Capacitor
import StoreKit

@objc(TikoZapStoreKitPlugin)
public class TikoZapStoreKitPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "TikoZapStoreKitPlugin"
    public let jsName = "TikoZapStoreKit"

    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(
            name: "getProducts",
            returnType: CAPPluginReturnPromise
        ),
        CAPPluginMethod(
            name: "purchase",
            returnType: CAPPluginReturnPromise
        ),
        CAPPluginMethod(
            name: "finishTransaction",
            returnType: CAPPluginReturnPromise
        ),
        CAPPluginMethod(
            name: "getUnfinishedTransactions",
            returnType: CAPPluginReturnPromise
        ),
        CAPPluginMethod(
            name: "restorePurchases",
            returnType: CAPPluginReturnPromise
        )
    ]

    private let productIDs: Set<String> = [
        "com.tikozap.starter.monthly",
        "com.tikozap.pro.monthly",
        "com.tikozap.business.monthly"
    ]

    @objc func getProducts(_ call: CAPPluginCall) {
        Task {
            do {
                let products = try await Product.products(
                    for: productIDs
                )

                let result: [[String: Any]] = products
                    .sorted { $0.price < $1.price }
                    .map { product in
                        [
                            "id": product.id,
                            "displayName": product.displayName,
                            "description": product.description,
                            "displayPrice": product.displayPrice
                        ]
                    }

                call.resolve([
                    "products": result
                ])
            } catch {
                call.reject(
                    "Unable to load App Store subscriptions.",
                    nil,
                    error
                )
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard
            let productID = call.getString("productId"),
            productIDs.contains(productID)
        else {
            call.reject("Invalid subscription product.")
            return
        }

        Task {
            do {
                let products = try await Product.products(
                    for: [productID]
                )

                guard let product = products.first else {
                    call.reject(
                        "Subscription product unavailable."
                    )
                    return
                }

                let result = try await product.purchase()

                switch result {
                case .success(let verification):
                    switch verification {
                    case .verified(let transaction):
                        call.resolve([
                            "status": "purchased",
                            "productId": transaction.productID,
                            "transactionId": String(transaction.id),
                            "originalTransactionId":
                                String(transaction.originalID),
                            "signedTransaction":
                                verification.jwsRepresentation
                        ])

                    case .unverified:
                        call.reject(
                            "App Store transaction could not be verified."
                        )
                    }

                case .pending:
                    call.resolve([
                        "status": "pending",
                        "productId": productID
                    ])

                case .userCancelled:
                    call.resolve([
                        "status": "cancelled",
                        "productId": productID
                    ])

                @unknown default:
                    call.reject(
                        "Unknown App Store purchase result."
                    )
                }
            } catch {
                call.reject(
                    "Unable to complete App Store purchase.",
                    nil,
                    error
                )
            }
        }
    }

    @objc func finishTransaction(_ call: CAPPluginCall) {
        guard
            let transactionID =
                call.getString("transactionId"),
            !transactionID.isEmpty
        else {
            call.reject("Transaction ID required.")
            return
        }

        Task {
            for await result in Transaction.unfinished {
                guard case .verified(let transaction) = result else {
                    continue
                }

                guard
                    String(transaction.id) == transactionID
                else {
                    continue
                }

                guard
                    productIDs.contains(transaction.productID)
                else {
                    call.reject(
                        "Invalid subscription transaction."
                    )
                    return
                }

                await transaction.finish()

                call.resolve([
                    "ok": true,
                    "transactionId": transactionID
                ])
                return
            }

            call.reject(
                "Unfinished App Store transaction not found."
            )
        }
    }

    @objc func getUnfinishedTransactions(_ call: CAPPluginCall) {
        Task {
            var unfinished: [[String: Any]] = []

            for await result in Transaction.unfinished {
                guard
                    case .verified(let transaction) = result,
                    productIDs.contains(transaction.productID)
                else {
                    continue
                }

                unfinished.append([
                    "productId": transaction.productID,
                    "transactionId": String(transaction.id),
                    "originalTransactionId":
                        String(transaction.originalID),
                    "signedTransaction":
                        result.jwsRepresentation
                ])
            }

            call.resolve([
                "transactions": unfinished
            ])
        }
    }

    @objc func restorePurchases(_ call: CAPPluginCall) {
        Task {
            do {
                try await AppStore.sync()

                var restored: [[String: Any]] = []

                for await result in Transaction.currentEntitlements {
                    guard
                        case .verified(let transaction) = result,
                        productIDs.contains(transaction.productID)
                    else {
                        continue
                    }

                    restored.append([
                        "productId": transaction.productID,
                        "transactionId": String(transaction.id),
                        "originalTransactionId":
                            String(transaction.originalID),
                        "signedTransaction":
                            result.jwsRepresentation
                    ])
                }

                call.resolve([
                    "subscriptions": restored
                ])
            } catch {
                call.reject(
                    "Unable to restore App Store purchases.",
                    nil,
                    error
                )
            }
        }
    }
}
