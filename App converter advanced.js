// app-converter-advanced.js
// ملف متقدم لمعالجة تحويل المواقع إلى APK

class AppBuilder {
    constructor() {
        this.apps = JSON.parse(localStorage.getItem('apps')) || [];
        this.initializeFirebase();
    }

    // تهيئة Firebase
    initializeFirebase() {
        // ضع مفاتيح Firebase الخاصة بك هنا
        const firebaseConfig = {
            apiKey: "YOUR_API_KEY",
            authDomain: "YOUR_PROJECT.firebaseapp.com",
            projectId: "YOUR_PROJECT_ID",
            storageBucket: "YOUR_PROJECT.appspot.com",
            messagingSenderId: "YOUR_MESSAGING_ID",
            appId: "YOUR_APP_ID"
        };

        try {
            // firebase.initializeApp(firebaseConfig);
            // this.db = firebase.firestore();
            // this.storage = firebase.storage();
        } catch (error) {
            console.log('Firebase لم يتم تحميله - استخدام LocalStorage');
        }
    }

    // التحقق من صحة URL
    validateURL(url) {
        try {
            new URL(url);
            return true;
        } catch (error) {
            return false;
        }
    }

    // التحقق من صحة البريد الإلكتروني
    validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    // إنشاء معرف فريد للتطبيق
    generateAppId() {
        return 'app_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // تحويل الصورة إلى base64
    async imageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // إنشاء ملف APK (محاكاة - في التطبيق الحقيقي يتم استدعاء خادم)
    async generateAPK(appData) {
        const apkConfig = {
            packageName: `com.appbuilder.${appData.id}`,
            appName: appData.name,
            version: '1.0.0',
            versionCode: 1,
            launchUrl: appData.url,
            primaryColor: appData.primaryColor,
            appIcon: appData.icon,
            permissions: [
                'android.permission.INTERNET',
                'android.permission.CHANGE_NETWORK_STATE',
                'android.permission.ACCESS_NETWORK_STATE'
            ],
            activities: [
                {
                    name: '.MainActivity',
                    label: appData.name,
                    launchMode: 'singleTask',
                    screenOrientation: 'portrait'
                }
            ]
        };

        return apkConfig;
    }

    // حفظ التطبيق
    async saveApp(appData) {
        const app = {
            id: this.generateAppId(),
            name: appData.name,
            url: appData.url,
            email: appData.email,
            description: appData.description,
            primaryColor: appData.primaryColor,
            textColor: appData.textColor,
            icon: appData.icon,
            createdAt: new Date().toLocaleDateString('ar-SA'),
            timestamp: Date.now(),
            status: 'completed'
        };

        // حفظ محلي
        this.apps.push(app);
        localStorage.setItem('apps', JSON.stringify(this.apps));

        // محاولة الحفظ في Firebase
        try {
            // await this.db.collection('apps').doc(app.id).set(app);
        } catch (error) {
            console.log('تم الحفظ محليًا فقط');
        }

        return app;
    }

    // استرجاع جميع التطبيقات
    getAllApps() {
        return this.apps;
    }

    // استرجاع تطبيق بواسطة ID
    getAppById(id) {
        return this.apps.find(app => app.id === id);
    }

    // حذف تطبيق
    deleteApp(id) {
        this.apps = this.apps.filter(app => app.id !== id);
        localStorage.setItem('apps', JSON.stringify(this.apps));

        try {
            // await this.db.collection('apps').doc(id).delete();
        } catch (error) {
            console.log('تم الحذف محليًا فقط');
        }

        return true;
    }

    // تحديث تطبيق
    async updateApp(id, updates) {
        const index = this.apps.findIndex(app => app.id === id);
        if (index !== -1) {
            this.apps[index] = { ...this.apps[index], ...updates };
            localStorage.setItem('apps', JSON.stringify(this.apps));

            try {
                // await this.db.collection('apps').doc(id).update(updates);
            } catch (error) {
                console.log('تم التحديث محليًا فقط');
            }

            return this.apps[index];
        }
        return null;
    }

    // حساب إحصائيات
    getStatistics() {
        return {
            totalApps: this.apps.length,
            appsCreatedToday: this.apps.filter(app => {
                const today = new Date().toLocaleDateString('ar-SA');
                return app.createdAt === today;
            }).length,
            totalDownloads: this.apps.reduce((sum, app) => sum + (app.downloads || 0), 0)
        };
    }

    // تصدير البيانات
    exportData() {
        const dataStr = JSON.stringify(this.apps, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `apps-backup-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    // استيراد البيانات
    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (Array.isArray(data)) {
                        this.apps = [...this.apps, ...data];
                        localStorage.setItem('apps', JSON.stringify(this.apps));
                        resolve(data);
                    } else {
                        reject('صيغة الملف غير صحيحة');
                    }
                } catch (error) {
                    reject('خطأ في قراءة الملف: ' + error.message);
                }
            };
            reader.onerror = () => reject('خطأ في قراءة الملف');
            reader.readAsText(file);
        });
    }
}

// إنشاء instance عام
const appBuilder = new AppBuilder();

// دوال مساعدة
function generateManifestXML(appData) {
    return `<?xml version="1.0" encoding="utf-8"?>
<manifest
    xmlns:android="http://schemas.android.com/apk/res/android"
    package="${appData.packageName}"
    android:versionCode="${appData.versionCode}"
    android:versionName="${appData.version}">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:label="${appData.appName}"
        android:icon="@mipmap/ic_launcher">

        <activity
            android:name=".MainActivity"
            android:label="${appData.appName}"
            android:launchMode="singleTask"
            android:screenOrientation="portrait">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

        </activity>

    </application>

</manifest>`;
}

function generateBuildGradle(appData) {
    return `
apply plugin: 'com.android.application'

android {
    compileSdkVersion 33
    defaultConfig {
        applicationId "${appData.packageName}"
        minSdkVersion 21
        targetSdkVersion 33
        versionCode ${appData.versionCode}
        versionName "${appData.version}"
    }
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    implementation 'com.android.support:appcompat-v7:28.0.0'
    implementation 'com.android.support:support-v4:28.0.0'
}
`;
}

// دالة لإنشاء صورة مربعة للأيقونة
function resizeImage(imageData, size = 512) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, size, size);
            resolve(canvas.toDataURL());
        };
        img.src = imageData;
    });
}

// دالة لحساب حجم التطبيق المتوقع
function estimateAPKSize(appData) {
    const baseSize = 5; // 5 MB
    const iconSize = 0.2; // 200 KB
    const webContainerSize = 3; // 3 MB
    
    return (baseSize + iconSize + webContainerSize).toFixed(1);
}
