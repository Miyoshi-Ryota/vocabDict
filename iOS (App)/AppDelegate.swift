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
        
        application.setMinimumBackgroundFetchInterval(UIApplication.backgroundFetchIntervalMinimum)
        
        BGTaskScheduler.shared.register(forTaskWithIdentifier: "com.vocabdict.sync", using: nil) { task in
            self.handleAppRefresh(task: task as! BGAppRefreshTask)
        }
        
        return true
    }
    
    func application(_ application: UIApplication, performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        CloudKitSyncManager.shared.performImmediateSync()
        completionHandler(.newData)
    }
    
    func applicationDidBecomeActive(_ application: UIApplication) {
        CloudKitSyncManager.shared.performImmediateSync()
    }
    
    private func handleAppRefresh(task: BGAppRefreshTask) {
        let queue = OperationQueue()
        queue.maxConcurrentOperationCount = 1
        
        let operation = BlockOperation {
            CloudKitSyncManager.shared.performImmediateSync()
        }
        
        task.expirationHandler = {
            queue.cancelAllOperations()
        }
        
        operation.completionBlock = {
            task.setTaskCompleted(success: !operation.isCancelled)
            self.scheduleAppRefresh()
        }
        
        queue.addOperation(operation)
    }
    
    private func scheduleAppRefresh() {
        let request = BGAppRefreshTaskRequest(identifier: "com.vocabdict.sync")
        request.earliestBeginDate = Date(timeIntervalSinceNow: 3600)
        
        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            print("Could not schedule app refresh: \(error)")
        }
    }

    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }

}
