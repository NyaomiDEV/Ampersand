# THIS FILE IS AUTO-GENERATED. DO NOT MODIFY!!

# Copyright 2020-2023 Tauri Programme within The Commons Conservancy
# SPDX-License-Identifier: Apache-2.0
# SPDX-License-Identifier: MIT

-keep class moe.ampersand.track.* {
  native <methods>;
}

-keep class moe.ampersand.track.WryActivity {
  public <init>(...);

  void setWebView(moe.ampersand.track.RustWebView);
  java.lang.Class getAppClass(...);
  int getId();
  java.lang.String getVersion();
  int startActivity(...);
}

-keep class moe.ampersand.track.Ipc {
  public <init>(...);

  @android.webkit.JavascriptInterface public <methods>;
}

-keep class moe.ampersand.track.RustWebView {
  public <init>(...);

  void loadUrlMainThread(...);
  void loadHTMLMainThread(...);
  void evalScript(...);
}

-keep class moe.ampersand.track.RustWebChromeClient,moe.ampersand.track.RustWebViewClient {
  public <init>(...);
}
