package com.mathenachhilfeonline.rechenblitz;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(RbWidgetPlugin.class);   // Brücke Web-App → Startbildschirm-Widget
        registerPlugin(RbUpdatePlugin.class);   // Inhalte selbst aktualisieren (GitHub, Ersatz: eigener Server)
        super.onCreate(savedInstanceState);
        // Musik/Ton sofort beim Öffnen, ohne erste Berührung (Capacitor setzt das schon; hier ausdrücklich)
        if (getBridge() != null && getBridge().getWebView() != null)
            getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
        // Zurück-Taste: erst die Web-App reagieren lassen (Fenster schließen, Runde beenden),
        // die App wird nur auf der Startseite verlassen.
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView wv = getBridge() != null ? getBridge().getWebView() : null;
                if (wv != null && wv.canGoBack()) wv.goBack();
                else { setEnabled(false); getOnBackPressedDispatcher().onBackPressed(); setEnabled(true); }
            }
        });
    }
}
