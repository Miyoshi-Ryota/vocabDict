//
//  AppDelegate.swift
//  macOS (App)
//
//  Created by Ryota Miyoshi on 2025/7/19.
//

import Cocoa

@main
class AppDelegate: NSObject, NSApplicationDelegate {
    
    private var syncTimer: Timer?

    func applicationDidFinishLaunching(_ notification: Notification) {
        DataController.shared.modelContext.autosaveEnabled = true
        
        CloudKitSyncManager.shared.setupBackgroundSync()
        
        syncTimer = Timer.scheduledTimer(withTimeInterval: 3600, repeats: true) { _ in
            CloudKitSyncManager.shared.performImmediateSync()
        }
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(applicationDidBecomeActive),
            name: NSApplication.didBecomeActiveNotification,
            object: nil
        )
    }
    
    @objc func applicationDidBecomeActive() {
        CloudKitSyncManager.shared.performImmediateSync()
    }
    
    func applicationWillTerminate(_ notification: Notification) {
        syncTimer?.invalidate()
        syncTimer = nil
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }

}
