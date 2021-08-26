package com.jolocom.reactlibrary;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;
import com.jolocom.reactlibrary.exception.SdkInitializationException;
import com.jolocom.reactlibrary.exception.SdkInternalException;
import com.jolocom.reactlibrary.exception.SdkNotInitializedException;
import com.jolocom.reactlibrary.exception.SendCommandException;

public class Aa2SdkModule extends ReactContextBaseJavaModule implements ActivityEventListener {
    private static final String NAME = "Aa2Sdk";
    private static final String INITIAL_NAME = "com.governikus.ausweisapp2.START_SERVICE";
    private static final String TAG = Aa2SdkModule.class.getSimpleName();

    private final ReactApplicationContext reactContext;
    private Aa2ServiceConnection aa2ServiceConnection;
    private EventEmitter eventEmitter;

    public Aa2SdkModule(ReactApplicationContext reactContext) {
        super(reactContext);

        this.reactContext = reactContext;
        reactContext.addActivityEventListener(this);
    }

    @Override
    public void initialize() {
        super.initialize();

        this.eventEmitter = new EventEmitter(reactContext.getJSModule(RCTDeviceEventEmitter.class));
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    @Override
    public void onNewIntent(Intent intent) {
        Log.i(TAG, "New intent request.");

        try {
            this.assertServiceConnectionInitialized("New intent processing failed");

            final Tag tag = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG);

            if (tag != null) {
                this.aa2ServiceConnection.updateSdkNfcTag(tag);
            }
        } catch (SdkNotInitializedException | SdkInternalException e) {
            this.eventEmitter.emit(EventName.ON_ERROR, e.getClass().getSimpleName());
        }

        Log.i(TAG, "New intent request processed successfully.");

        this.eventEmitter.emit(EventName.ON_NEW_INTENT_SUCCESS);
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent intent) {
        // TODO I assume we don't actually make use of this
    }

    @ReactMethod
    public void initAASdk() {
        final String packageName = this.reactContext.getApplicationContext().getPackageName();
        final Intent startSdkServiceIntent = new Intent(INITIAL_NAME).setPackage(packageName);

        this.aa2ServiceConnection = new Aa2ServiceConnection(this.eventEmitter);

        try {
            this.reactContext.bindService(
                startSdkServiceIntent,
                this.aa2ServiceConnection,
                Context.BIND_AUTO_CREATE
            );
        } catch (SecurityException e) {
            Log.e(TAG, SdkInitializationException.DEFAULT_ERROR_MESSAGE, e);

            this.eventEmitter.emit(
                EventName.ON_ERROR,
                SdkInitializationException.class.getSimpleName()
            );
        }

        Log.i(TAG, "SDK initialized successfully.");

        this.eventEmitter.emit(EventName.ON_SDK_INIT);
    }

    @ReactMethod
    public void sendCMD(String command) {
        Log.i(TAG, String.format("Command execution request. Command: '%s'", command));

        try {
            this.assertServiceConnectionInitialized("Command sending failed");

            this.aa2ServiceConnection.sendCommand(command);
        } catch (SdkNotInitializedException | SdkInternalException | SendCommandException e) {
            this.eventEmitter.emit(EventName.ON_ERROR, e.getClass().getSimpleName());
        }

        Log.i(TAG, "Command execution request sent successfully.");

        this.eventEmitter.emit(EventName.ON_COMMAND_SENT_SUCCESSFULLY);
    }

    @ReactMethod
    public void disconnectSdk() {
        try {
            this.assertServiceConnectionInitialized("Sdk disconnection failed");
        } catch (SdkNotInitializedException e) {
            this.eventEmitter.emit(EventName.ON_ERROR, e.getClass().getSimpleName());
        }

        this.reactContext.unbindService(this.aa2ServiceConnection);

        Log.i(TAG, "SDK disconnected successfully.");

        this.eventEmitter.emit(EventName.ON_SDK_DISCONNECT);
    }

    private void assertServiceConnectionInitialized(String message) {
        if (this.aa2ServiceConnection == null) {
            String errorMessage = String.format("%s. Service connection not initialized.", message);

            Log.e(TAG, errorMessage);

            throw new SdkNotInitializedException(errorMessage);
        }
    }
}
