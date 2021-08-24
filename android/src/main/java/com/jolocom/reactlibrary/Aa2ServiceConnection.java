package com.jolocom.reactlibrary;

import android.content.ComponentName;
import android.content.ServiceConnection;
import android.nfc.Tag;
import android.os.IBinder;
import android.os.RemoteException;
import android.util.Log;

import com.governikus.ausweisapp2.IAusweisApp2Sdk;

import com.jolocom.reactlibrary.exception.SdkInitializationException;
import com.jolocom.reactlibrary.exception.SdkInternalException;
import com.jolocom.reactlibrary.exception.SdkNotInitializedException;
import com.jolocom.reactlibrary.exception.SendCommandException;

// Will connect to the AA2 background service. Stores the random session identifier
public class Aa2ServiceConnection implements ServiceConnection {
    private static final String TAG = Aa2ServiceConnection.class.getSimpleName();
    // What we care about here is getting the SDK instance, as well as the mSessionId
    // Once we connect to the background service, we attempt to establish a session with the SDK, then set the instantiated SDK
    private IAusweisApp2Sdk sdk;
    private Aa2SdkSession sdkSession;

    @Override
    public void onServiceConnected(ComponentName className, IBinder service) {
        IAusweisApp2Sdk sdk = IAusweisApp2Sdk.Stub.asInterface(service);
        Aa2SdkSession sdkSession = new Aa2SdkSession();

        try {
            if (!sdk.connectSdk(sdkSession)) {
                Log.e(TAG, SdkInitializationException.DEFAULT_ERROR_MESSAGE);

                throw new SdkInitializationException();
            }
        } catch (RemoteException e) {
            Log.e(TAG, SdkInitializationException.DEFAULT_ERROR_MESSAGE, e);

            throw new SdkInitializationException(e);
        }

        this.sdk = sdk;
        this.sdkSession = sdkSession;
    }

    // TODO What clean-up do we need to do when disconnected from the background service?
    @Override
    public void onServiceDisconnected(ComponentName className) {
        // ...
    }

    public void sendCommand(String command) {
        this.assertSdkInitialized(String.format(
            "Command processing failed. SDK not initialized. Command: '%s'.",
            command
        ));

        boolean isSendSuccessfully;

        try {
            isSendSuccessfully = this.sdk.send(
                this.sdkSession.getSessionMessagesBuffer().getSessionId(),
                command
            );
        } catch (RemoteException e) {
            String errorMessage = String.format(
                "Command processing failed. Command: %s",
                command
            );

            Log.e(TAG, errorMessage, e);

            throw new SdkInternalException(errorMessage, e);
        }

        if (!isSendSuccessfully) {
            String errorMessage = String.format(
                "Command processing failed. IAusweisApp2Sdk::send() returns 'false'. Command: '%s'.",
                command
            );

            Log.e(TAG, errorMessage);

            throw new SendCommandException(errorMessage);
        }
    }

    public void updateSdkNfcTag(Tag tag) {
        this.assertSdkInitialized(String.format(
            "Sdk tag update failed. SDK not initialized. Tag: '%s'.",
            tag.toString()
        ));

        try {
            this.sdk.updateNfcTag(this.sdkSession.getSessionMessagesBuffer().getSessionId(), tag);
        } catch (RemoteException e) {
            String errorMessage = String.format("Sdk tag update failed. Tag: '%s'.", tag.toString());

            Log.e(TAG, errorMessage);

            throw new SdkInternalException(errorMessage, e);
        }
    }

    public SessionMessagesBuffer getSessionMessagesBuffer() {
        this.assertSdkInitialized("Session message buffer unavailable. SDK not initialized.");

        return this.sdkSession.getSessionMessagesBuffer();
    }

    private void assertSdkInitialized(String message) {
        if (this.sdk == null || this.sdkSession == null) {
            Log.e(TAG, message);

            throw new SdkNotInitializedException(message);
        }
    }
}
