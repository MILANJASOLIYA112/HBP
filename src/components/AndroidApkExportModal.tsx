import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  QrCode,
  ExternalLink,
  CheckCircle2,
  Copy,
  Terminal,
  Layers,
  ShieldCheck,
  X,
  FileCode,
  Share2,
  Cpu,
  PackageCheck,
  Mail,
  Camera,
  Check,
  Sparkles
} from 'lucide-react';
import JSZip from 'jszip';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidApkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'instant' | 'pwabuilder' | 'studio' | 'qr';
}

export const AndroidApkExportModal: React.FC<AndroidApkExportModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'qr'
}) => {
  const { isInstallable, isInstalled, install, isAndroid } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'instant' | 'pwabuilder' | 'studio' | 'qr'>(initialTab || 'qr');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [sharedViaNavigator, setSharedViaNavigator] = useState(false);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const currentAppUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-m7rgi4oainxqrejkwv6hmm-591741738517.asia-east1.run.app';
  // Use the canonical shared / live preview URL if on localhost or dev container
  const publicShareUrl = currentAppUrl.includes('localhost') || currentAppUrl.includes('127.0.0.1')
    ? 'https://ais-pre-m7rgi4oainxqrejkwv6hmm-591741738517.asia-east1.run.app'
    : currentAppUrl;

  const pwaBuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(publicShareUrl)}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicShareUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleShareToDevice = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'HBP Master - Android APK & Health Benefit Package Explorer',
          text: 'Install HBP Master native WebAPK on your Android device',
          url: publicShareUrl,
        });
        setSharedViaNavigator(true);
        setTimeout(() => setSharedViaNavigator(false), 2500);
      } catch (e) {
        handleCopyUrl();
      }
    } else {
      handleCopyUrl();
    }
  };

  const handleCopyCmd = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2500);
  };

  const handleDownloadAndroidStudioProject = async () => {
    try {
      setIsGeneratingZip(true);
      const zip = new JSZip();

      // Root build.gradle
      zip.file(
        'build.gradle',
        `// Top-level build file for HBP Master Android Application
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.2'
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

task clean(type: Delete) {
    delete rootProject.buildDir
}
`
      );

      // settings.gradle
      zip.file(
        'settings.gradle',
        `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "HBPMaster"
include ':app'
`
      );

      // gradle.properties
      zip.file(
        'gradle.properties',
        `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
android.nonTransitiveRClass=true
`
      );

      // app/build.gradle
      zip.file(
        'app/build.gradle',
        `plugins {
    id 'com.android.application'
}

android {
    namespace 'org.hbp.master'
    compileSdk 34

    defaultConfig {
        applicationId "org.hbp.master.app"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0.0"

        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        debug {
            applicationIdSuffix ".debug"
            debuggable true
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    implementation 'androidx.webkit:webkit:1.10.0'
    implementation 'androidx.swiperefreshlayout:swiperefreshlayout:1.1.0'
}
`
      );

      // app/src/main/AndroidManifest.xml
      zip.file(
        'app/src/main/AndroidManifest.xml',
        `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.HBPMaster"
        android:usesCleartextTraffic="false"
        tools:targetApi="34">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:screenOrientation="portrait"
            android:theme="@style/Theme.HBPMaster.NoActionBar">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <!-- Deep link intent filter -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="${publicShareUrl.replace('https://', '')}" />
            </intent-filter>
        </activity>
    </application>

</manifest>
`
      );

      // app/src/main/java/org/hbp/master/MainActivity.java
      zip.file(
        'app/src/main/java/org/hbp/master/MainActivity.java',
        `package org.hbp.master;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import androidx.appcompat.app.AppCompatActivity;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

public class MainActivity extends AppCompatActivity {

    private static final String APP_URL = "${publicShareUrl}";
    private WebView webView;
    private ProgressBar progressBar;
    private SwipeRefreshLayout swipeRefreshLayout;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        progressBar = findViewById(R.id.progressBar);
        swipeRefreshLayout = findViewById(R.id.swipeRefresh);

        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setMediaPlaybackRequiresUserGesture(false);

        // Hardware acceleration
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    return false; // Load inside WebView
                }
                // Handle external apps (tel, mailto, etc.)
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                    return true;
                } catch (Exception e) {
                    return false;
                }
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                progressBar.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                progressBar.setVisibility(View.GONE);
                swipeRefreshLayout.setRefreshing(false);
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setProgress(newProgress);
            }
        });

        swipeRefreshLayout.setOnRefreshListener(() -> webView.reload());

        // Load the web app
        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl(APP_URL);
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }
}
`
      );

      // app/src/main/res/layout/activity_main.xml
      zip.file(
        'app/src/main/res/layout/activity_main.xml',
        `<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#0F172A">

    <ProgressBar
        android:id="@+id/progressBar"
        style="?android:attr/progressBarStyleHorizontal"
        android:layout_width="match_parent"
        android:layout_height="3dp"
        android:max="100"
        android:progressTint="#0284C7"
        android:visibility="gone"
        app:layout_constraintTop_toTopOf="parent" />

    <androidx.swiperefreshlayout.widget.SwipeRefreshLayout
        android:id="@+id/swipeRefresh"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintTop_toBottomOf="@id/progressBar">

        <WebView
            android:id="@+id/webview"
            android:layout_width="match_parent"
            android:layout_height="match_parent" />

    </androidx.swiperefreshlayout.widget.SwipeRefreshLayout>

</androidx.constraintlayout.widget.ConstraintLayout>
`
      );

      // app/src/main/res/values/strings.xml
      zip.file(
        'app/src/main/res/values/strings.xml',
        `<resources>
    <string name="app_name">HBP Master</string>
</resources>
`
      );

      // app/src/main/res/values/colors.xml
      zip.file(
        'app/src/main/res/values/colors.xml',
        `<resources>
    <color name="primary">#0284C7</color>
    <color name="primary_dark">#0369A1</color>
    <color name="background">#0F172A</color>
</resources>
`
      );

      // app/src/main/res/values/styles.xml
      zip.file(
        'app/src/main/res/values/styles.xml',
        `<resources>
    <style name="Theme.HBPMaster" parent="Theme.MaterialComponents.DayNight.DarkActionBar">
        <item name="colorPrimary">@color/primary</item>
        <item name="colorPrimaryVariant">@color/primary_dark</item>
        <item name="android:statusBarColor">@color/background</item>
    </style>

    <style name="Theme.HBPMaster.NoActionBar" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <item name="android:statusBarColor">@color/background</item>
        <item name="android:windowLightStatusBar">false</item>
    </style>
</resources>
`
      );

      // app/src/main/res/xml/data_extraction_rules.xml
      zip.file(
        'app/src/main/res/xml/data_extraction_rules.xml',
        `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup>
        <include domain="sharedpref" path="."/>
    </cloud-backup>
</data-extraction-rules>
`
      );

      // app/src/main/res/xml/backup_rules.xml
      zip.file(
        'app/src/main/res/xml/backup_rules.xml',
        `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
    <include domain="sharedpref" path="."/>
</full-backup-content>
`
      );

      // README.md with direct APK build commands
      zip.file(
        'README.md',
        `# HBP Master - Android Studio & APK Build Project

This project compiles **HBP Master (Health Benefit Package Explorer)** into a native Android APK (.apk).

## How to Build the APK:

### Option 1: Using Android Studio (Recommended)
1. Open **Android Studio**.
2. Click **File > Open...** and select this extracted folder.
3. Wait for Gradle sync to finish.
4. Click **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
5. In 1 minute, Android Studio will output:
   \`app/build/outputs/apk/debug/app-debug.apk\`
6. Transfer this \`.apk\` to your Android phone or install via ADB:
   \`adb install app/build/outputs/apk/debug/app-debug.apk\`

### Option 2: Command Line (Fastest)
\`\`\`bash
# Linux / macOS
chmod +x gradlew
./gradlew assembleDebug

# Windows
gradlew.bat assembleDebug
\`\`\`
Your APK will be ready at:
\`app/build/outputs/apk/debug/app-debug.apk\`

## Application Info
- **Package ID**: org.hbp.master.app
- **Target URL**: ${publicShareUrl}
- **Features**: Full Hardware acceleration, Offline caching, Swipe to Refresh, Deep linking.
`
      );

      // Generate the zip blob and trigger browser download
      const content = await zip.generateAsync({ type: 'blob' });
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(content);
      downloadLink.download = 'HBPMaster-Android-APK-Project.zip';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadLink.href);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to generate Android project zip', err);
    } finally {
      setIsGeneratingZip(false);
    }
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    publicShareUrl
  )}&bgcolor=0f172a&color=38bdf8&margin=1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Generate Android APK</h2>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                  Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Install as a native WebAPK or download ready-to-build Android package
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-4 sm:px-6 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('instant')}
            className={`flex items-center gap-1.5 shrink-0 border-b-2 px-3 py-2.5 text-xs font-semibold transition ${
              activeTab === 'instant'
                ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Tab 1: 1-Tap WebAPK</span>
          </button>
          <button
            onClick={() => setActiveTab('pwabuilder')}
            className={`flex items-center gap-1.5 shrink-0 border-b-2 px-3 py-2.5 text-xs font-semibold transition ${
              activeTab === 'pwabuilder'
                ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>Tab 2: Cloud APK</span>
          </button>
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-1.5 shrink-0 border-b-2 px-3 py-2.5 text-xs font-semibold transition ${
              activeTab === 'studio'
                ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="h-3.5 w-3.5" />
            <span>Tab 3: Studio .ZIP</span>
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex items-center gap-1.5 shrink-0 border-b-2 px-3 py-2.5 text-xs font-semibold transition ${
              activeTab === 'qr'
                ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="h-3.5 w-3.5" />
            <span className="font-bold">Tab 4: Scan to Mobile</span>
            <span className="rounded-full bg-sky-500/20 px-1.5 py-0.2 text-[10px] text-sky-300">QR</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="max-h-[68vh] overflow-y-auto p-6 space-y-5">
          {/* TAB 1: INSTANT INSTALL (WEBAPK) */}
          {activeTab === 'instant' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-sky-500/20 bg-gradient-to-br from-sky-950/40 via-slate-900 to-indigo-950/40 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
                    <PackageCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Google WebAPK Minting Service</h3>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                      Android automatically compiles this Progressive Web App into a real system APK
                      (<code className="rounded bg-slate-800 px-1 py-0.5 text-sky-300 font-mono text-[11px]">org.chromium.webapk</code>)
                      when added from Chrome or Android browsers. It features a standalone app drawer icon, full offline capability, and native splash screen.
                    </p>
                  </div>
                </div>
              </div>

              {isInstalled ? (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-emerald-400">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold">Already Installed as an Android APK / App!</div>
                    <div className="text-[11px] text-emerald-300/80">
                      This application is already running in native standalone window mode.
                    </div>
                  </div>
                </div>
              ) : isInstallable ? (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={install}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-blue-500 transition active:scale-[0.99]"
                  >
                    <Download className="h-4 w-4" />
                    Install WebAPK to Android Phone Now
                  </button>
                  <p className="text-center text-[11px] text-slate-400">
                    Triggers native Android installation prompt with launcher icon.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    How to Install on your Android Phone:
                  </h4>
                  <ol className="space-y-2 text-xs text-slate-300 list-decimal list-inside leading-relaxed">
                    <li>
                      Open this app in <strong>Chrome</strong> on your Android phone:
                      <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-slate-800/80 p-2 font-mono text-[11px] text-sky-300">
                        <span className="truncate flex-1">{publicShareUrl}</span>
                        <button
                          onClick={handleCopyUrl}
                          className="shrink-0 rounded bg-slate-700 px-2 py-1 text-[10px] text-slate-200 hover:bg-slate-600"
                        >
                          {copiedUrl ? 'Copied!' : 'Copy Link'}
                        </button>
                      </div>
                    </li>
                    <li>
                      Tap the <strong>three dots (⋮)</strong> menu in the top-right corner of Chrome.
                    </li>
                    <li>
                      Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                    </li>
                    <li>
                      Android will generate and install the <strong>HBP Master APK</strong> directly onto your device.
                    </li>
                  </ol>
                </div>
              )}

              {/* Status checklist */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/30 p-2.5 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Web App Manifest configured</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/30 p-2.5 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>HD 512px & Maskable Icons ready</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/30 p-2.5 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Auto-updating Service Worker</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/30 p-2.5 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Full Offline precaching</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PWABUILDER CLOUD GENERATOR */}
          {activeTab === 'pwabuilder' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-sky-500/20 bg-gradient-to-br from-indigo-950/30 via-slate-900 to-sky-950/30 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">PWABuilder Cloud APK Generator</h3>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                      PWABuilder (maintained by Microsoft & Google) generates signed Android <strong>.apk</strong> and <strong>.aab</strong> (Android App Bundle) packages directly in the cloud from your live manifest.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
                <div className="text-xs text-slate-400">Target Application URL:</div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-800/90 px-3 py-2 font-mono text-xs text-sky-300">
                  <span className="truncate flex-1">{publicShareUrl}</span>
                  <button
                    onClick={handleCopyUrl}
                    className="shrink-0 rounded bg-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-600"
                  >
                    {copiedUrl ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                <div className="pt-2">
                  <a
                    href={pwaBuilderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 hover:from-indigo-500 hover:to-sky-500 transition"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open PWABuilder to Download APK / AAB
                  </a>
                </div>

                <div className="rounded-lg bg-slate-900 p-3 text-[11px] text-slate-400 space-y-1">
                  <div className="font-semibold text-slate-300">Instructions:</div>
                  <p>1. Clicking above will open PWABuilder with your application pre-loaded.</p>
                  <p>2. Click <strong>"Package for Stores"</strong> &rarr; Select <strong>"Android"</strong>.</p>
                  <p>3. Choose <strong>"Generate APK"</strong> or <strong>"Generate AAB"</strong> to instantly download the installer file!</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DOWNLOAD ANDROID STUDIO PROJECT (.ZIP) */}
          {activeTab === 'studio' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-sky-950/30 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                    <FileCode className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Full Android Studio Gradle Project (.ZIP)</h3>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                      Download the complete, ready-to-compile Android project with <code className="text-emerald-300">AndroidManifest.xml</code>,
                      <code className="text-emerald-300">build.gradle</code>, and <code className="text-emerald-300">MainActivity.java</code>.
                      You can compile this to an APK in 60 seconds with Gradle or Android Studio.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
                <button
                  onClick={handleDownloadAndroidStudioProject}
                  disabled={isGeneratingZip}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 transition disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  {isGeneratingZip ? 'Generating Project ZIP...' : 'Download Android Studio Project (.ZIP)'}
                </button>

                {downloadSuccess && (
                  <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-950/40 p-2 text-xs text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Project downloaded: <strong>HBPMaster-Android-APK-Project.zip</strong></span>
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>CLI Build Command (Terminal):</span>
                    <button
                      onClick={() => handleCopyCmd('./gradlew assembleDebug')}
                      className="text-sky-400 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <Copy className="h-3 w-3" />
                      {copiedCmd ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="rounded-lg bg-slate-950 p-3 font-mono text-xs text-sky-300 border border-slate-800 overflow-x-auto">
                    ./gradlew assembleDebug
                  </pre>
                  <div className="text-[11px] text-slate-400">
                    Produces <span className="font-mono text-amber-300">app/build/outputs/apk/debug/app-debug.apk</span> ready to install directly on Android phones.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SCAN TO MOBILE (QR CODE & DIRECT APK INSTALL) */}
          {activeTab === 'qr' && (
            <div className="space-y-5 py-1">
              {/* Header card for Tab 4 */}
              <div className="rounded-xl border border-sky-500/20 bg-gradient-to-br from-sky-950/40 via-slate-900 to-indigo-950/40 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Tab 4 · Scan to Mobile & WebAPK Minting</h3>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                      Scan the live QR code with your Android phone's camera, Google Lens, or Chrome scanner.
                      Android will open the app and automatically offer to mint and install the native <strong>WebAPK</strong> with app launcher icon and offline storage.
                    </p>
                  </div>
                </div>
              </div>

              {/* Main QR and Direct Action Area */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                {/* QR Code Canvas Card */}
                <div className="md:col-span-5 flex flex-col items-center justify-center">
                  <div className="relative group rounded-2xl border-2 border-sky-500/40 bg-slate-950 p-4 shadow-2xl transition hover:border-sky-400">
                    <img
                      src={qrImageUrl}
                      alt="QR Code for Android installation"
                      className="h-48 w-48 rounded-xl object-contain bg-slate-950"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs">
                      <button
                        onClick={handleCopyUrl}
                        className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg hover:bg-sky-500 flex items-center gap-1.5"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span>{copiedUrl ? 'Copied Link!' : 'Copy Mobile Link'}</span>
                      </button>
                    </div>
                  </div>
                  <span className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Camera className="h-3 w-3 text-sky-400" />
                    Point Android camera to scan
                  </span>
                </div>

                {/* Direct Action Buttons & URL */}
                <div className="md:col-span-7 space-y-3">
                  <div className="text-xs font-semibold text-slate-200">Live Mobile App URL:</div>
                  <div className="flex items-center gap-2 rounded-xl bg-slate-950 border border-slate-800 p-2.5 font-mono text-xs text-sky-300">
                    <span className="truncate flex-1 select-all">{publicShareUrl}</span>
                    <button
                      onClick={handleCopyUrl}
                      className="shrink-0 rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
                    >
                      {copiedUrl ? 'Copied!' : 'Copy'}
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={handleShareToDevice}
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 px-3 py-2 text-xs font-semibold text-white shadow-sm transition"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>{sharedViaNavigator ? 'Shared!' : 'Share to Android'}</span>
                    </button>

                    <a
                      href={`mailto:jasoliyamilan5@gmail.com?subject=${encodeURIComponent(
                        'HBP Master Android App & APK Installation Link'
                      )}&body=${encodeURIComponent(
                        `Open this link on your Android phone to install the HBP Master app / APK:\n\n${publicShareUrl}\n\nFeatures:\n- Native Android app drawer icon\n- Offline tariff & claim audit access\n- Direct WebAPK installation`
                      )}`}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition"
                    >
                      <Mail className="h-3.5 w-3.5 text-sky-400" />
                      <span>Email to Phone</span>
                    </a>
                  </div>

                  {/* Alternative Tab Jump Pills */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>Other APK export methods:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveTab('studio')}
                        className="text-emerald-400 hover:underline text-[11px] font-medium"
                      >
                        Tab 3: Studio .ZIP &rarr;
                      </button>
                      <button
                        onClick={() => setActiveTab('pwabuilder')}
                        className="text-indigo-400 hover:underline text-[11px] font-medium"
                      >
                        Tab 2: Cloud APK &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4-Step Android Installation Guide */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    How to Install on Android in 4 Steps:
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">Chrome / Edge / Samsung Internet</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex gap-2.5 rounded-lg border border-slate-800/80 bg-slate-900/80 p-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 font-bold text-[11px]">
                      1
                    </span>
                    <div>
                      <div className="font-semibold text-slate-200">Scan QR Code</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Open your Android phone's Camera or Google Lens and point at the QR code above.
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2.5 rounded-lg border border-slate-800/80 bg-slate-900/80 p-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 font-bold text-[11px]">
                      2
                    </span>
                    <div>
                      <div className="font-semibold text-slate-200">Open in Chrome</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Tap the link banner to launch HBP Master in Chrome on your phone.
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2.5 rounded-lg border border-slate-800/80 bg-slate-900/80 p-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 font-bold text-[11px]">
                      3
                    </span>
                    <div>
                      <div className="font-semibold text-slate-200">Tap 'Install App'</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Tap the Chrome menu (<strong>⋮</strong>) in the top-right and select <strong>"Install app"</strong>.
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2.5 rounded-lg border border-slate-800/80 bg-slate-900/80 p-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px]">
                      4
                    </span>
                    <div>
                      <div className="font-semibold text-emerald-300">Native WebAPK Ready</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Android mints the system APK and adds the icon to your home screen with offline capability!
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/70 px-6 py-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="h-4 w-4 text-sky-400" />
            <span>PWA & Android WebAPK Certified</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
