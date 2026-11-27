package com.mathenachhilfeonline.rechenblitz;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.appupdate.AppUpdateOptions;
import com.google.android.play.core.install.InstallStateUpdatedListener;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.InstallStatus;
import com.google.android.play.core.install.model.UpdateAvailability;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Iterator;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;

/**
 * Rechenblitz – Inhalte selbst aktualisieren (Marcel 15.11.2026: „der Updateserver soll der Git sein“).
 *
 * Die App bringt einen vollständigen Stand mit (läuft sofort und ohne Internet). Beim Start fragt sie
 * stand.json ab – zuerst GitHub (Branch rechenblitz-live bzw. rechenblitz-test), als Ersatz den eigenen Server.
 * Neue oder geänderte Dateien werden geladen und per SHA-256 geprüft; nur ein vollständig geprüfter Stand
 * wird übernommen (eigener Ordner, Capacitor lädt ihn ab dem nächsten Start bzw. sofort per apply()).
 * Ohne Netz oder bei Fehlern bleibt der letzte gute Stand. Verlangt der neue Stand eine neuere Hülle
 * (stand.shell > RB_SHELL), wird nichts übernommen und die Web-App bittet um die neue APK.
 */
@CapacitorPlugin(name = "RbUpdate")
public class RbUpdatePlugin extends Plugin {

    private static final String PREFS = "RbUpdate";
    private static final String REPO_RAW = "https://raw.githubusercontent.com/marceldaum-commits/School/";
    private static final ExecutorService POOL = Executors.newSingleThreadExecutor();
    private static final Object LOCK = new Object();

    static String[] sources() {
        boolean live = "live".equals(BuildConfig.RB_CHANNEL);
        return new String[] {
            REPO_RAW + (live ? "rechenblitz-live" : "rechenblitz-test") + "/kopfrechnen/",
            live ? "https://rechenblitz.mathenachhilfe-online.com/" : "https://rechenblitz-test.mathenachhilfe-online.com/"
        };
    }

    @Override
    public void load() {
        // kurz nach dem Start im Hintergrund prüfen – die App ist dann schon bedienbar
        POOL.submit(() -> {
            try { Thread.sleep(4000); } catch (InterruptedException ignored) {}
            JSObject r = runCheck();
            if ("downloaded".equals(r.getString("result")) || "needShell".equals(r.getString("result"))) notifyListeners("ready", r, true);
        });
    }

    @PluginMethod
    public void status(PluginCall call) { call.resolve(statusObj(null)); }

    @PluginMethod
    public void check(PluginCall call) { POOL.submit(() -> call.resolve(runCheck())); }

    /* ---------------- Play-Fassung: In-App-Updates von Google Play (Leitstand 16.11.) ----------------
       Neue App-Hüllen kommen nur über Google Play. Die App zeigt das Update selbst an:
       flexibel (lädt im Hintergrund, Neustart später) oder sofort (wenn der neue Inhalt eine neuere Hülle braucht). */
    private AppUpdateManager playMgr;
    private InstallStateUpdatedListener playListener;

    @PluginMethod
    public void playUpdate(PluginCall call) {
        JSObject r = new JSObject();
        if (!"play".equals(BuildConfig.RB_STORE)) { r.put("result", "notplay"); call.resolve(r); return; }
        final boolean immediate = Boolean.TRUE.equals(call.getBoolean("immediate", false));
        try {
            if (playMgr == null) playMgr = AppUpdateManagerFactory.create(getContext());
            playMgr.getAppUpdateInfo().addOnSuccessListener(info -> {
                JSObject o = new JSObject();
                o.put("versionCode", info.availableVersionCode());
                if (info.installStatus() == InstallStatus.DOWNLOADED) { o.put("result", "downloaded"); call.resolve(o); return; }
                int avail = info.updateAvailability();
                boolean running = avail == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS;
                int type = immediate || running ? AppUpdateType.IMMEDIATE : AppUpdateType.FLEXIBLE;
                if ((avail == UpdateAvailability.UPDATE_AVAILABLE || running) && info.isUpdateTypeAllowed(type)) {
                    if (type == AppUpdateType.FLEXIBLE && playListener == null) {
                        playListener = state -> { if (state.installStatus() == InstallStatus.DOWNLOADED) notifyListeners("playReady", new JSObject(), true); };
                        playMgr.registerListener(playListener);
                    }
                    playMgr.startUpdateFlow(info, getActivity(), AppUpdateOptions.newBuilder(type).build());
                    o.put("result", type == AppUpdateType.IMMEDIATE ? "immediate" : "flexible");
                } else o.put("result", avail == UpdateAvailability.UPDATE_NOT_AVAILABLE ? "none" : "unavailable");
                call.resolve(o);
            }).addOnFailureListener(e -> { JSObject o = new JSObject(); o.put("result", "error"); call.resolve(o); });
        } catch (Exception e) { r.put("result", "error"); call.resolve(r); }
    }

    /** heruntergeladenes Play-Update installieren (App startet neu) */
    @PluginMethod
    public void playComplete(PluginCall call) {
        try { if (playMgr == null) playMgr = AppUpdateManagerFactory.create(getContext()); playMgr.completeUpdate(); } catch (Exception ignored) {}
        call.resolve();
    }

    /** geladenen Stand sofort aktivieren (lädt die Web-App neu) */
    @PluginMethod
    public void apply(PluginCall call) {
        String dir = capPath(getContext());
        if (dir == null || dir.isEmpty() || !new File(dir, "index.html").exists() || dir.equals(currentBase())) { call.resolve(statusObj(null)); return; }
        call.resolve(statusObj(null));
        getActivity().runOnUiThread(() -> getBridge().setServerBasePath(dir));
    }

    /* ---------------- Zustand ---------------- */

    private String currentBase() {
        try { return getBridge().getServerBasePath(); } catch (Exception e) { return null; }
    }

    private static String capPath(Context c) {
        return c.getSharedPreferences(com.getcapacitor.plugin.WebView.WEBVIEW_PREFS_NAME, Activity.MODE_PRIVATE)
            .getString(com.getcapacitor.plugin.WebView.CAP_SERVER_PATH, "");
    }

    /** stand.json des Standes, der gerade angezeigt wird (eigener Ordner oder mitgelieferter Stand) */
    private JSONObject runningStand() {
        String base = currentBase();
        try {
            if (base != null && new File(base, "stand.json").exists()) return new JSONObject(readText(new FileInputStream(new File(base, "stand.json"))));
        } catch (Exception ignored) {}
        return bundledStand();
    }

    private JSONObject bundledStand() {
        try { return new JSONObject(readText(getContext().getAssets().open("public/stand.json"))); } catch (Exception e) { return new JSONObject(); }
    }

    private JSObject statusObj(String result) {
        SharedPreferences p = getContext().getSharedPreferences(PREFS, Activity.MODE_PRIVATE);
        JSONObject run = runningStand();
        JSObject o = new JSObject();
        if (result != null) o.put("result", result);
        o.put("channel", BuildConfig.RB_CHANNEL);
        o.put("store", BuildConfig.RB_STORE);
        o.put("shell", BuildConfig.RB_SHELL);
        o.put("version", run.optString("version", ""));
        o.put("id", run.optString("id", ""));
        o.put("bundled", bundledStand().optString("version", ""));
        String dir = capPath(getContext());
        boolean pending = dir != null && !dir.isEmpty() && new File(dir, "index.html").exists() && !dir.equals(currentBase());
        o.put("pending", pending ? p.getString("readyVersion", "") : "");
        o.put("needShell", p.getInt("needShell", 0) > BuildConfig.RB_SHELL ? p.getInt("needShell", 0) : 0);
        o.put("needVersion", p.getString("needVersion", ""));
        o.put("lastCheck", p.getLong("lastCheck", 0));
        o.put("source", p.getString("source", ""));
        return o;
    }

    /* ---------------- Prüfen und laden ---------------- */

    private JSObject runCheck() {
        synchronized (LOCK) {
            SharedPreferences p = getContext().getSharedPreferences(PREFS, Activity.MODE_PRIVATE);
            try {
                String[] src = sources();
                JSONObject stand = null;
                int used = -1;
                for (int i = 0; i < src.length && stand == null; i++) {
                    try {
                        JSONObject s = new JSONObject(new String(get(src[i] + "stand.json?t=" + System.currentTimeMillis()), StandardCharsets.UTF_8));
                        if ("rechenblitz".equals(s.optString("app")) && s.optJSONObject("files") != null && !s.optString("id").isEmpty()) { stand = s; used = i; }
                    } catch (Exception ignored) {}
                }
                p.edit().putLong("lastCheck", System.currentTimeMillis()).apply();
                if (stand == null) return statusObj("offline");
                p.edit().putString("source", used == 0 ? "github" : "server").apply();

                String id = stand.getString("id"), version = stand.optString("version");
                int shell = stand.optInt("shell", 1);
                if (shell > BuildConfig.RB_SHELL) {   // dieser Stand braucht eine neuere App-Hülle → nichts übernehmen
                    p.edit().putInt("needShell", shell).putString("needVersion", version).apply();
                    return statusObj("needShell");
                }
                p.edit().remove("needShell").remove("needVersion").apply();

                JSONObject run = runningStand(), bundled = bundledStand();
                File root = new File(getContext().getFilesDir(), "rbweb"), target = new File(root, id);
                String pendingDir = capPath(getContext());
                if (id.equals(run.optString("id"))) return statusObj("uptodate");
                if (target.getAbsolutePath().equals(pendingDir) && new File(target, "index.html").exists()) return statusObj("downloaded");
                if (verNum(version) < verNum(bundled.optString("version"))) return statusObj("uptodate");   // nie älter als der mitgelieferte Stand

                // neuen Stand vollständig in einen Zwischenordner laden und prüfen
                File tmp = new File(root, id + ".tmp");
                deleteRec(tmp);
                if (!tmp.mkdirs()) return statusObj("error");
                JSONObject files = stand.getJSONObject("files");
                JSONObject runFiles = run.optJSONObject("files");
                String base = currentBase();
                for (Iterator<String> it = files.keys(); it.hasNext(); ) {
                    String rel = it.next(), hash = files.getString(rel);
                    if (!safePath(rel) || !hash.matches("[0-9a-f]{64}")) { deleteRec(tmp); return statusObj("error"); }
                    byte[] data = null;
                    if (runFiles != null && hash.equals(runFiles.optString(rel))) data = localFile(base, rel);   // unverändert → vom Gerät kopieren
                    if (data == null || !hash.equals(sha256(data))) {
                        data = null;
                        for (int i = 0; i < src.length && data == null; i++) {
                            int k = (used + i) % src.length;
                            try {
                                byte[] d = get(src[k] + rel + "?v=" + hash.substring(0, 12));
                                if (hash.equals(sha256(d))) data = d;
                            } catch (Exception ignored) {}
                        }
                    }
                    if (data == null) { deleteRec(tmp); return statusObj("error"); }   // unvollständig → alten Stand behalten
                    File f = new File(tmp, rel);
                    File parent = f.getParentFile();
                    if (parent != null) parent.mkdirs();
                    try (FileOutputStream os = new FileOutputStream(f)) { os.write(data); }
                }
                try (FileOutputStream os = new FileOutputStream(new File(tmp, "stand.json"))) { os.write(stand.toString().getBytes(StandardCharsets.UTF_8)); }
                deleteRec(target);
                if (!tmp.renameTo(target)) { deleteRec(tmp); return statusObj("error"); }

                // ab dem nächsten Start (oder sofort per apply) diesen Stand laden; alte Ordner aufräumen
                getContext().getSharedPreferences(com.getcapacitor.plugin.WebView.WEBVIEW_PREFS_NAME, Activity.MODE_PRIVATE)
                    .edit().putString(com.getcapacitor.plugin.WebView.CAP_SERVER_PATH, target.getAbsolutePath()).apply();
                p.edit().putString("readyVersion", version).apply();
                File[] old = root.listFiles();
                if (old != null) for (File d : old) if (!d.equals(target) && (base == null || !d.getAbsolutePath().equals(base))) deleteRec(d);
                return statusObj("downloaded");
            } catch (Exception e) {
                return statusObj("error");
            }
        }
    }

    /* ---------------- Hilfen ---------------- */

    private byte[] localFile(String base, String rel) {
        try {
            if (base != null && new File(base).isDirectory()) return readAll(new FileInputStream(new File(base, rel)));
            return readAll(getContext().getAssets().open("public/" + rel));
        } catch (Exception e) { return null; }
    }

    private static boolean safePath(String rel) {
        return !rel.isEmpty() && !rel.startsWith("/") && !rel.contains("..") && !rel.contains("\\") && rel.matches("[A-Za-z0-9._/-]+");
    }

    private static byte[] get(String url) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(12000);
        c.setReadTimeout(20000);
        c.setRequestProperty("Cache-Control", "no-cache");
        c.setRequestProperty("User-Agent", "Rechenblitz-App");
        try {
            if (c.getResponseCode() != 200) throw new Exception("HTTP " + c.getResponseCode());
            return readAll(c.getInputStream());
        } finally { c.disconnect(); }
    }

    private static byte[] readAll(InputStream in) throws Exception {
        try (InputStream is = in; ByteArrayOutputStream bo = new ByteArrayOutputStream()) {
            byte[] b = new byte[16384];
            int n;
            long total = 0;
            while ((n = is.read(b)) > 0) {
                total += n;
                if (total > 20_000_000) throw new Exception("zu groß");
                bo.write(b, 0, n);
            }
            return bo.toByteArray();
        }
    }

    private static String readText(InputStream in) throws Exception { return new String(readAll(in), StandardCharsets.UTF_8); }

    private static String sha256(byte[] d) throws Exception {
        byte[] h = MessageDigest.getInstance("SHA-256").digest(d);
        StringBuilder sb = new StringBuilder();
        for (byte x : h) sb.append(String.format("%02x", x));
        return sb.toString();
    }

    private static long verNum(String v) {
        long n = 0;
        for (String part : (v == null ? "" : v).split("\\.")) {
            try { n = n * 1000 + Long.parseLong(part); } catch (Exception e) { n = n * 1000; }
        }
        return n;
    }

    private static void deleteRec(File f) {
        if (f == null || !f.exists()) return;
        File[] k = f.listFiles();
        if (k != null) for (File x : k) deleteRec(x);
        f.delete();
    }
}
