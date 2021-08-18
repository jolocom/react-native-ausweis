package com.jolocom.reactlibrary;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.os.RemoteException;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class Aa2SdkModule extends ReactContextBaseJavaModule implements ActivityEventListener {
    private static final String NAME = "Aa2Sdk";
    private static final String INITIAL_NAME = "com.governikus.ausweisapp2.START_SERVICE";

    private final ReactApplicationContext reactContext;
    private Aa2ServiceConnection aa2ServiceConnection;

    public Aa2SdkModule(ReactApplicationContext reactContext) {
        super(reactContext);

        this.reactContext = reactContext;
        reactContext.addActivityEventListener(this);
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    @Override
    public void onNewIntent(Intent intent) {
        final Tag tag = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG);

        if (tag != null) {
            try {
                this.aa2ServiceConnection.updateSdkNfcTag(tag);
            } catch (RemoteException e) {
                // ...
            } catch (Exception e) {
                // TODO: Intercept all other exceptions
                //  (e.g. aa2ServiceConnection can be not initialized) and process
            }
        }
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent intent) {
        // TODO I assume we don't actually make use of this
    }

    @ReactMethod
    public void initAASdk (final Promise promise) {
        final String packageName = this.reactContext.getApplicationContext().getPackageName();
        final Intent startSdkServiceIntent = new Intent(INITIAL_NAME).setPackage(packageName);

        this.aa2ServiceConnection = new Aa2ServiceConnection(promise);
        this.reactContext.bindService(
            startSdkServiceIntent,
            this.aa2ServiceConnection,
            Context.BIND_AUTO_CREATE
        );
    }

    @ReactMethod
    public void sendCMD(String command, Promise promise) {
        try {
            promise.resolve(this.aa2ServiceConnection.sendCommand(command));
        } catch (RemoteException e) {
            // TODO Error handling?
            promise.reject(e);
        }
    }

    @ReactMethod
    public void getNewEvents(Promise promise) {
        promise.resolve(this.aa2ServiceConnection.getSessionMessagesBuffer().getBuffer());
        this.aa2ServiceConnection.getSessionMessagesBuffer().resetBuffer();
    }

    @ReactMethod
    public void disconnectSdk(Promise promise) {
        this.reactContext.unbindService(this.aa2ServiceConnection);
        promise.resolve("Ok");
    }
}
