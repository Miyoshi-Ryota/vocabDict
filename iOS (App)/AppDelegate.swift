//
//  AppDelegate.swift
//  iOS (App)
//
//  Created by Ryota Miyoshi on 2025/7/19.
//

import UIKit
import BackgroundTasks

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        DataController.shared.modelContext.autosaveEnabled = true
        
        CloudKitSyncManager.shared.setupBackgroundSync()
        
        return true
    }
    
    func application(_ application: UIApplication, performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        CloudKitSyncManager.shared.performImmediateSync()
        completionHandler(.newData)
    }
    
    func applicationDidBecomeActive(_ application: UIApplication) {
        CloudKitSyncManager.shared.performImmediateSync()
    }
    

    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }

}
