import java.util.Properties
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

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
    compileSdk = 37
    namespace = "moe.ampersand.track"
    ndkVersion = "29.0.14206865"
    defaultConfig {
        manifestPlaceholders["usesCleartextTraffic"] = "false"
        if(System.getenv("AMPERSAND_BUILD_TYPE") !== null && System.getenv("AMPERSAND_BUILD_TYPE").equals("stable-oldpackage")) {
            applicationId = "moe.ampersand.app"
        } else {
            applicationId = "moe.ampersand.track"
        }
        minSdk = 29
        targetSdk = 37
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
            if(System.getenv("AMPERSAND_BUILD_TYPE") !== null) {
                if(System.getenv("AMPERSAND_BUILD_TYPE").equals("unstable")) {
                    applicationIdSuffix = ".unstable"
                    manifestPlaceholders["appName"] = "@string/app_name_unstable"
                    base.archivesName.set("ampersand-unstable")
                    isDebuggable = true
                    isJniDebuggable = true
                    isMinifyEnabled = false
                }
                else if(System.getenv("AMPERSAND_BUILD_TYPE").endsWith("-sideload")) {
                    applicationIdSuffix = ".sideload"
                    base.archivesName.set("ampersand-sideload")
                }
            }
            optimization {
               enable = true
            }
            proguardFiles(
                *fileTree(".") {
                  include("**/*.pro")
                  exclude("build/**")
                }.files.toTypedArray()
            )
        }
        getByName("debug") {
            applicationIdSuffix = ".debug"
            manifestPlaceholders["usesCleartextTraffic"] = "true"
            manifestPlaceholders["appName"] = "@string/app_name_debug"
            if(System.getenv("AMPERSAND_BUILD_TYPE") === null) {
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
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    buildFeatures {
        buildConfig = true
    }
}

kotlin {
    compilerOptions {
        jvmTarget = JvmTarget.JVM_1_8
    }
}

rust {
    rootDirRel = "../../../"
}

dependencies {
    implementation("androidx.webkit:webkit:1.14.0")
    implementation("androidx.appcompat:appcompat:1.7.1")
    implementation("androidx.activity:activity-ktx:1.10.1")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.lifecycle:lifecycle-process:2.10.0")
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.4")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.0")
}

apply(from = file("tauri.build.gradle.kts"))
