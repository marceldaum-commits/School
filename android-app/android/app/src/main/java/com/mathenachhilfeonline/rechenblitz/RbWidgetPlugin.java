package com.mathenachhilfeonline.rechenblitz;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Die Web-App schickt fertige (übersetzte) Texte für das Widget; gespeichert nur auf dem Gerät. */
@CapacitorPlugin(name = "RbWidget")
public class RbWidgetPlugin extends Plugin {
    @PluginMethod
    public void update(PluginCall call) {
        Context ctx = getContext();
        SharedPreferences.Editor e = ctx.getSharedPreferences(RbWidget.PREFS, Context.MODE_PRIVATE).edit();
        for (String k : new String[] { "title", "line1", "line2", "button", "idle1", "idle2" }) {
            String v = call.getString(k);
            if (v != null) e.putString(k, v);
        }
        e.putString("day", call.getString("day", ""));
        e.apply();
        RbWidget.refreshAll(ctx);
        call.resolve();
    }
}
