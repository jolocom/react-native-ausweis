package com.jolocom.reactlibrary;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.nfc.NfcAdapter;
import android.nfc.Tag;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import com.jolocom.reactlibrary.exception.SdkInitializationException;
import com.jolocom.reactlibrary.exception.SdkNotInitializedException;

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
    public void initAASdk (final Promise promise) {
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
            throw new SdkInitializationException("Service connection failed.", e);
        }

        // TODO: Define if we can hande exceptions in one point
        //  (for example ReactApplicationContext::setNativeModuleCallExceptionHandler())
        //  and if so - just if it not throws - means that all is ok and continue on js level
        //  might be reason to remove promise usage
        promise.resolve("Ok");
    }

    @ReactMethod
    public void sendCMD(String command, Promise promise) {
        // TODO: Define if we can hande exceptions in one point
        //  (for example ReactApplicationContext::setNativeModuleCallExceptionHandler())
        //  and if so - just if it not throws - means that all is ok and continue on js level
        //  might be reason to remove promise usage
        this.assertServiceConnectionInitialized("Command sending failed");

        this.aa2ServiceConnection.sendCommand(command);
    }

    @ReactMethod
    public void getNewEvents(Promise promise) {
        this.assertServiceConnectionInitialized("New events reading failed");

        promise.resolve(this.aa2ServiceConnection.getSessionMessagesBuffer().getBuffer());
        this.aa2ServiceConnection.getSessionMessagesBuffer().resetBuffer();
    }

    @ReactMethod
    public void disconnectSdk(Promise promise) {
        this.assertServiceConnectionInitialized("Sdk disconnection failed");

        this.reactContext.unbindService(this.aa2ServiceConnection);

        // TODO: Define if we can hande exceptions in one point
        //  (for example ReactApplicationContext::setNativeModuleCallExceptionHandler())
        //  and if so - just if it not throws - means that all is ok and continue on js level
        //  might be reason to remove promise usage
        promise.resolve("Ok");
    }

    private void assertServiceConnectionInitialized(String message) {
        if (this.aa2ServiceConnection == null) {
            throw new SdkNotInitializedException(
                String.format("%s. Service connection not initialized.", message
            ));
        }
    }
}
