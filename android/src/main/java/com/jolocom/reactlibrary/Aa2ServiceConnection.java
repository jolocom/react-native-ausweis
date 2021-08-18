package com.jolocom.reactlibrary;

import android.content.ComponentName;
import android.content.ServiceConnection;
import android.nfc.Tag;
import android.os.IBinder;
import android.os.RemoteException;

import com.facebook.react.bridge.Promise;
import com.governikus.ausweisapp2.IAusweisApp2Sdk;

// Will connect to the AA2 background service. Stores the random session identifier
public class Aa2ServiceConnection implements ServiceConnection {
    // What we care about here is getting the SDK instance, as well as the mSessionId
    // Once we connect to the background service, we attempt to establish a session with the SDK, then set the instantiated SDK
    private IAusweisApp2Sdk sdk;
    private Aa2SdkSession sdkSession;

    // Only used to communicate back to React Native that the instantiation has completed
    private final Promise promise;

    public Aa2ServiceConnection(Promise promise) {
        this.promise = promise;
    }

    @Override
    public void onServiceConnected(ComponentName className, IBinder service)
    {
        try {
            this.sdk = IAusweisApp2Sdk.Stub.asInterface(service);
            this.sdkSession = new Aa2SdkSession(promise);

            if (!this.sdk.connectSdk(this.sdkSession)) {
                // TODO Throw error
            }
        } catch (RemoteException e) {
            // TODO Return the error
            this.sdk = null;
        }
    }

    // TODO What clean-up do we need to do when disconnected from the background service?
    @Override
    public void onServiceDisconnected(ComponentName className) {
        // ...
    }

    public boolean sendCommand(String command) throws RemoteException {
        // TODO Boolean returned to singal success, handle failure
        return this.sdk.send(this.sdkSession.getSessionMessagesBuffer().getSessionId(), command);
    }

    public void updateSdkNfcTag(Tag tag) throws RemoteException {
        this.sdk.updateNfcTag(this.sdkSession.getSessionMessagesBuffer().getSessionId(), tag);
    }

    public SessionMessagesBuffer getSessionMessagesBuffer() {
        return this.sdkSession.getSessionMessagesBuffer();
    }
}
