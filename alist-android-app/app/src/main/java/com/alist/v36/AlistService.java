package com.alist.v36;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.os.Process;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;

public class AlistService extends Service {
    private Process process;
    private Thread outputThread;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        startForeground(1, createNotification());

        try {
            File binDir = new File(getFilesDir(), "alist_bin");
            binDir.mkdirs();
            File binary = new File(binDir, "alist");

            if (!binary.exists()) {
                copyAsset("alist/alist", binary);
            }

            binary.setExecutable(true);

            String dataDir = getFilesDir().getAbsolutePath();
            ProcessBuilder pb = new ProcessBuilder("./alist", "server");
            pb.directory(binDir);
            pb.redirectErrorStream(true);
            pb.environment().put("HOME", dataDir);
            pb.environment().put("ALIST_DATA_DIR", dataDir + "/alist_data");

            process = pb.start();

            InputStream inputStream = process.getInputStream();
            outputThread = new Thread(() -> {
                byte[] buffer = new byte[4096];
                try {
                    while (inputStream.read(buffer) != -1) {
                    }
                } catch (IOException e) {
                    Thread.currentThread().interrupt();
                }
            });
            outputThread.setDaemon(true);
            outputThread.start();
        } catch (IOException e) {
            stopSelf();
        }
    }

    private void copyAsset(String assetPath, File outputFile) throws IOException {
        InputStream inputStream = getAssets().open(assetPath);
        FileOutputStream outputStream = new FileOutputStream(outputFile);
        byte[] buffer = new byte[8192];
        int length;
        while ((length = inputStream.read(buffer)) != -1) {
            outputStream.write(buffer, 0, length);
        }
        outputStream.flush();
        outputStream.close();
        inputStream.close();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                "alist_service_channel",
                "AList Service",
                NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }

    private Notification createNotification() {
        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(this, "alist_service_channel");
        } else {
            builder = new Notification.Builder(this);
        }
        return builder
            .setContentTitle("AList")
            .setContentText("AList Service is running")
            .setSmallIcon(android.R.drawable.ic_menu_manage)
            .build();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (process != null) {
            process.destroy();
        }
        if (outputThread != null) {
            outputThread.interrupt();
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
