package com.belalalnuaimi.hamoudiadventures;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import androidx.annotation.Nullable;
import com.getcapacitor.BridgeActivity;

/**
 * Single activity that hosts the Capacitor WebView bridge, which loads the
 * offline Phaser build from dist/ (bundled under android_asset/public).
 * No custom plugins are registered here — the game needs no native APIs
 * beyond what Capacitor core provides (splash screen), matching the
 * zero-dangerous-permissions requirement in AndroidManifest.xml.
 *
 * Immersive edge-to-edge fullscreen is enabled here deliberately: without
 * it, Phaser's canvas can fill its WebView container perfectly and the
 * screen can STILL look "incomplete" because the Android status bar and/or
 * navigation bar remain visible above/below it, eating real screen space
 * that no amount of Phaser Scale Manager tuning can reclaim -- that's a
 * native/OS-level concern, not a canvas-sizing one.
 */
public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(@Nullable Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    hideSystemBars();
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    // Re-apply immersive mode whenever focus returns -- a system gesture
    // (swipe from edge) can temporarily reveal the bars again otherwise.
    if (hasFocus) hideSystemBars();
  }

  private void hideSystemBars() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      WindowInsetsController controller = getWindow().getInsetsController();
      if (controller != null) {
        controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
        controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
      }
    } else {
      // Legacy flag-based immersive mode for pre-Android 11 devices.
      getWindow()
        .getDecorView()
        .setSystemUiVisibility(
          View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        );
    }
  }
}
