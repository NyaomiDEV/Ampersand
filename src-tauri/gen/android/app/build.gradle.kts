import java.util.Properties
import java.io.FileInputStream

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("rust")
}

val tauriProperties = Properties().apply {
    val propFile = file("tauri.properties")
    if (propFile.exists()) {
        propFile.inputStream().use { load(it) }
    }
}

val localProperties = Properties().apply {
    val localPropertiesFile = rootProject.file("local.properties")
    if (localPropertiesFile.exists()) {
        localPropertiesFile.inputStream().use { load(it) }
    }
}

android {
    compileSdk = 36
    namespace = "moe.ampersand.app"
    defaultConfig {
        manifestPlaceholders["usesCleartextTraffic"] = "false"
        applicationId = "moe.ampersand.app"
        minSdk = 26
        targetSdk = 36
        versionCode = tauriProperties.getProperty("tauri.android.versionCode", "1").toInt()
        versionName = tauriProperties.getProperty("tauri.android.versionName", "1.0")
    }
    signingConfigs {
        create("release") {
            if(!localProperties.isEmpty()){
                keyAlias = localProperties["keyAlias"] as String
                keyPassword = localProperties["password"] as String
                storeFile = file(localProperties["storeFile"] as String)
                storePassword = localProperties["password"] as String
            } else {
                println("Keystore properties file not found. No signing configuration will be applied.")
            }
        }
    }
    buildTypes {
        getByName("release") {
            signingConfig = signingConfigs.findByName("release")
            isMinifyEnabled = true
            manifestPlaceholders["appName"] = "@string/app_name"
            base.archivesName.set("ampersand")
            if(
                System.getenv("GITHUB_REF_NAME") !== null &&
                System.getenv("GITHUB_REF_NAME").equals("main")
            ) {
                applicationIdSuffix = ".ci"
                manifestPlaceholders["appName"] = "@string/app_name_ci"
                base.archivesName.set("ampersand-ci")
                isDebuggable = true
                isJniDebuggable = true
                isMinifyEnabled = false
            }
            proguardFiles(
                *fileTree(".") { include("**/*.pro") }
                    .plus(getDefaultProguardFile("proguard-android-optimize.txt"))
                    .toList().toTypedArray()
            )
        }
        getByName("debug") {
            manifestPlaceholders["usesCleartextTraffic"] = "true"
            manifestPlaceholders["appName"] = "@string/app_name_debug"
            if(
                System.getenv("npm_config_argv") !== null &&
                System.getenv("npm_config_argv").contains("[\"tauri\",\"android\",\"dev\"]")
            ) {
                base.archivesName.set("app")
            }
            isDebuggable = true
            isJniDebuggable = true
            isMinifyEnabled = false
            packaging {
                jniLibs.keepDebugSymbols.add("*/arm64-v8a/*.so")
                jniLibs.keepDebugSymbols.add("*/armeabi-v7a/*.so")
                jniLibs.keepDebugSymbols.add("*/x86/*.so")
                jniLibs.keepDebugSymbols.add("*/x86_64/*.so")
            }
        }
        dependenciesInfo {
            // Disables dependency metadata when building APKs (for IzzyOnDroid/F-Droid)
            includeInApk = false
            // Disables dependency metadata when building Android App Bundles (for Google Play)
            includeInBundle = false
        }
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
    buildFeatures {
        buildConfig = true
    }
}

rust {
    rootDirRel = "../../../"
}

dependencies {
    implementation("androidx.webkit:webkit:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.1")
    implementation("androidx.activity:activity-ktx:1.12.2")
    implementation("com.google.android.material:material:1.13.0")
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.3.0")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.7.0")
}

apply(from = "tauri.build.gradle.kts")
