plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.alist.v36"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.alist.v36"
        minSdk = 31
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    signingConfigs {
        create("release") {
            storeFile = file("alist.jks")
            storePassword = "alist123"
            keyAlias = "alist"
            keyPassword = "alist123"
        }
    }

    ndkVersion = "25.2.9519653"

    ndk {
        abiFilters += "arm64-v8a"
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
        }
    }

    buildFeatures {
        viewBinding = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.10.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.webkit:webkit:1.8.0")
    implementation("androidx.lifecycle:lifecycle-service:2.6.2")
}
