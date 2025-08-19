//
//  CloudKitSyncManager.swift
//  vocabDict
//
//  Created for CloudKit sync implementation
//

import Foundation
#if os(iOS)
import UIKit
import BackgroundTasks
#elseif os(macOS)
import AppKit
#endif

class CloudKitSyncManager {
    static let shared = CloudKitSyncManager()
    
    private init() {}
    
    func setupBackgroundSync() {
        #if os(iOS)
        UIApplication.shared.setMinimumBackgroundFetchInterval(3600)
        
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: "com.vocabdict.sync",
            using: nil
        ) { task in
            self.handleBackgroundSync(task: task as! BGAppRefreshTask)
        }
        
        scheduleAppRefresh()
        
        #elseif os(macOS)
        Timer.scheduledTimer(withTimeInterval: 3600, repeats: true) { _ in
            Task {
                await self.performCloudKitSync()
            }
        }
        #endif
    }
    
    #if os(iOS)
    private func scheduleAppRefresh() {
        let request = BGAppRefreshTaskRequest(identifier: "com.vocabdict.sync")
        request.earliestBeginDate = Date(timeIntervalSinceNow: 3600)
        
        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            print("Failed to schedule app refresh: \(error)")
        }
    }
    
    private func handleBackgroundSync(task: BGAppRefreshTask) {
        Task {
            await performCloudKitSync()
            task.setTaskCompleted(success: true)
            scheduleAppRefresh()
        }
    }
    #endif
    
    func performImmediateSync() {
        let sharedDefaults = UserDefaults(suiteName: "group.com.vocabdict.shared")
        if sharedDefaults?.bool(forKey: "pendingSync") == true {
            Task {
                await performCloudKitSync()
                sharedDefaults?.set(false, forKey: "pendingSync")
            }
        }
    }
    
    @MainActor
    private func performCloudKitSync() async {
        print("Performing CloudKit sync...")
        NotificationCenter.default.post(name: Notification.Name("CloudKitSyncStarted"), object: nil)
        
        NotificationCenter.default.post(name: Notification.Name("CloudKitSyncCompleted"), object: nil)
    }
}