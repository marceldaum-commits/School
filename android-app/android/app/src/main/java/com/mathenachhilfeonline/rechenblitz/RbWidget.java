package com.mathenachhilfeonline.rechenblitz;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/** Rechenblitz-Widget für den Startbildschirm: Merk-Training, Tagesziel, Serie – ein Tipp öffnet die App. */
public class RbWidget extends AppWidgetProvider {
    static final String PREFS = "rb_widget";

    @Override
    public void onUpdate(Context ctx, AppWidgetManager m, int[] ids) {
        for (int id : ids) m.updateAppWidget(id, views(ctx));
    }

    static RemoteViews views(Context ctx) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.ROOT).format(new Date());
        boolean fresh = today.equals(p.getString("day", ""));   // Stand von heute? Sonst freundliche Einladung
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.rb_widget);
        v.setTextViewText(R.id.rb_title, p.getString("title", ctx.getString(R.string.rb_w_title)));
        v.setTextViewText(R.id.rb_line1, fresh ? p.getString("line1", "") : p.getString("idle1", ctx.getString(R.string.rb_w_idle1)));
        v.setTextViewText(R.id.rb_line2, fresh ? p.getString("line2", "") : p.getString("idle2", ctx.getString(R.string.rb_w_idle2)));
        v.setTextViewText(R.id.rb_button, p.getString("button", ctx.getString(R.string.rb_w_button)));
        Intent i = new Intent(ctx, MainActivity.class);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(ctx, 0, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.rb_root, pi);
        return v;
    }

    static void refreshAll(Context ctx) {
        AppWidgetManager m = AppWidgetManager.getInstance(ctx);
        int[] ids = m.getAppWidgetIds(new ComponentName(ctx, RbWidget.class));
        for (int id : ids) m.updateAppWidget(id, views(ctx));
    }
}
