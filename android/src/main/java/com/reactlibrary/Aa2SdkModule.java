// Aa2SdkModule.java
package com.reactlibrary;

import android.content.ServiceConnection;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableNativeArray;

import com.facebook.react.bridge.ReactMethod;
import android.content.Intent;
import static java.lang.System.out;
import java.util.*;
import com.facebook.react.bridge.ActivityEventListener;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.IBinder;
import android.os.RemoteException;
import android.content.ComponentName;

import com.governikus.ausweisapp2.IAusweisApp2Sdk;
import com.governikus.ausweisapp2.IAusweisApp2SdkCallback;

import android.nfc.NfcAdapter;
import android.nfc.Tag;


class Aa2SdkSession extends IAusweisApp2SdkCallback.Stub
{
  public String mSessionId = null;
  private WritableArray messageBuffer = new WritableNativeArray();
  private Promise promise = null;

  public Aa2SdkSession(Promise rnPromise) {
    promise = rnPromise;
  }

  public ReadableArray getMessages() {
    return messageBuffer;
  }

  @Override
  public void sessionIdGenerated(String pSessionId, boolean pIsSecureSessionId) throws RemoteException
  {
      mSessionId = pSessionId;
      System.out.println("RESOLVING");
      promise.resolve("Ok");
  }

  @Override
  public void receive(String pJson) throws RemoteException
  {
    messageBuffer.pushString(pJson);
  }

  // TODO Add
  @Override
  public void sdkDisconnected()
  {
  }

  public void resetMessageBuffer() {
    messageBuffer = new WritableNativeArray();
  }
}

// Will connect to the AA2 background service. Stores the random session identifier
class Aa2ServiceConnection implements ServiceConnection {
    // What we care about here is getting the SDK instance, as well as the mSessionId
    // Once we connect to the background service, we attempt to establish a session with the SDK, then set the instantiated SDK
    public IAusweisApp2Sdk aa2Sdk = null;
    public String mSessionId = null;
    public Aa2SdkSession aa2SdkSession = null;

    // Only used to communicate back to React Native that the instantiation has completed
    private Promise promise = null;

    public Aa2ServiceConnection(Promise rnPromise) {
      super();
      promise = rnPromise;
    }

    @Override
    public void onServiceConnected(ComponentName className, IBinder service)
    {
        try {
          aa2Sdk = IAusweisApp2Sdk.Stub.asInterface(service);
          aa2SdkSession = new Aa2SdkSession(promise);

          if (!aa2Sdk.connectSdk(aa2SdkSession)) {
            // TODO Throw error
          }

          mSessionId = aa2SdkSession.mSessionId;
        } catch (RemoteException e) {
          // TODO Return the error
          aa2Sdk = null;
        }
    }

    // TODO What clean-up do we need to do when disconnected from the background service?
    @Override
    public void onServiceDisconnected(ComponentName className)
    {
    // ...
    }

    public boolean sendCommand(String command) throws RemoteException {
          // TODO Boolean returned to singal success, handle failure
          return aa2Sdk.send(mSessionId, command);
    }
}

public class Aa2SdkModule extends ReactContextBaseJavaModule implements ActivityEventListener {
    private Aa2ServiceConnection aa2ServiceConnection = null;

    private final ReactApplicationContext reactContext;

    public Aa2SdkModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        reactContext.addActivityEventListener(this);
    }

    @Override
    public String getName() {
        return "Aa2Sdk";
    }

    @Override
    public void onNewIntent(Intent intent) {
        final Tag tag = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG);

        if (tag != null) {
          try {
            aa2ServiceConnection.aa2Sdk.updateNfcTag(aa2ServiceConnection.mSessionId, tag);
          } catch (RemoteException e) {
            // ...
          }
        }
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent intent) {
      // TODO I assume we don't actually make use of this
    }

    @ReactMethod
    public void initAASdk (final Promise promise) {
        final String intentName = "com.governikus.ausweisapp2.START_SERVICE";
        final String pkgName = reactContext.getApplicationContext().getPackageName();
        final Intent startSdkServiceIntent = new Intent(intentName).setPackage(pkgName);

        aa2ServiceConnection = new Aa2ServiceConnection(promise);
        reactContext.bindService(startSdkServiceIntent, aa2ServiceConnection, Context.BIND_AUTO_CREATE);
    }

    @ReactMethod
    public void sendCMD(String command, Promise promise) {
        try {
          promise.resolve(aa2ServiceConnection.sendCommand(command));
        } catch (RemoteException e) {
          // TODO Error handling?
          promise.reject(e);
        }
    }

    @ReactMethod
    public void getNewEvents(Promise promise) {
      promise.resolve(aa2ServiceConnection.aa2SdkSession.getMessages());
      aa2ServiceConnection.aa2SdkSession.resetMessageBuffer();
    }

    @ReactMethod
    public void disconnectSdk(Promise promise) {
      reactContext.unbindService(aa2ServiceConnection);
      promise.resolve("Ok");
    }
  }
