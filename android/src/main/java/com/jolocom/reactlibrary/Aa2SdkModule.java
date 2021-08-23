package com.jolocom.reactlibrary;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import com.jolocom.reactlibrary.exception.SdkInitializationException;
import com.jolocom.reactlibrary.exception.SdkInternalException;
import com.jolocom.reactlibrary.exception.SdkNotInitializedException;
import com.jolocom.reactlibrary.exception.SendCommandException;

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
        this.assertServiceConnectionInitialized("New intent processing failed");

        final Tag tag = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG);

        if (tag != null) {
            this.aa2ServiceConnection.updateSdkNfcTag(tag);
        }
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent intent) {
        // TODO I assume we don't actually make use of this
    }

    @ReactMethod
    public void initAASdk(final Promise promise) {
        final String packageName = this.reactContext.getApplicationContext().getPackageName();
        final Intent startSdkServiceIntent = new Intent(INITIAL_NAME).setPackage(packageName);

        this.aa2ServiceConnection = new Aa2ServiceConnection();

        try {
            this.reactContext.bindService(
                startSdkServiceIntent,
                this.aa2ServiceConnection,
                Context.BIND_AUTO_CREATE
            );
        } catch (SecurityException e) {
            Log.e(
                this.getClass().getSimpleName(),
                SdkInitializationException.DEFAULT_ERROR_MESSAGE,
                e
            );

            promise.reject(
                SdkInitializationException.class.getSimpleName(),
                SdkInitializationException.DEFAULT_ERROR_MESSAGE
            );
        }

        promise.resolve("Ok");
    }

    @ReactMethod
    public void sendCMD(String command, Promise promise) {
        try {
            this.assertServiceConnectionInitialized("Command sending failed");

            this.aa2ServiceConnection.sendCommand(command);
        } catch (SdkNotInitializedException | SdkInternalException | SendCommandException e) {
            promise.reject(e.getClass().getSimpleName(), e.getMessage());
        }

        promise.resolve("Ok");
    }

    @ReactMethod
    public void getNewEvents(Promise promise) {
        try {
            this.assertServiceConnectionInitialized("New events reading failed");

            promise.resolve(this.aa2ServiceConnection.getSessionMessagesBuffer().getBuffer());

            this.aa2ServiceConnection.getSessionMessagesBuffer().resetBuffer();
        } catch (SdkNotInitializedException e) {
            promise.reject(e.getClass().getSimpleName(), e.getMessage());
        }
    }

    @ReactMethod
    public void disconnectSdk(Promise promise) {
        try {
            this.assertServiceConnectionInitialized("Sdk disconnection failed");
        } catch (SdkNotInitializedException e) {
            promise.reject(e.getClass().getSimpleName(), e.getMessage());
        }

        this.reactContext.unbindService(this.aa2ServiceConnection);

        promise.resolve("Ok");
    }

    private void assertServiceConnectionInitialized(String message) {
        if (this.aa2ServiceConnection == null) {
            String errorMessage = String.format("%s. Service connection not initialized.", message);

            Log.e(this.getClass().getSimpleName(), errorMessage);

            throw new SdkNotInitializedException(errorMessage);
        }
    }
}
