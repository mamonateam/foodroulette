/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
 */

package cc.codehero.foodroulette;

import android.os.Bundle;
import android.util.Log;
import android.webkit.WebView;

import org.apache.cordova.*;

public class foodroulette extends CordovaActivity 
{
    @Override
    public void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);
        super.init();
        // Set by <content src="index.html" /> in config.xml
        super.loadUrl(Config.getStartUrl());
        //super.loadUrl("file:///android_asset/www/index.html")
        this.appView.setWebViewClient(new CordovaWebViewClient(this, this.appView) {

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {

                if(url.contains("http://localhost:9000/#/login")) {
                	 String md5_hash = url.replace("http://localhost:9000/", "");
                     url = "file:///android_asset/www/index.html";
                     view.loadUrl("javascript:window.location.href = '"+md5_hash+"';");
                     Log.d("DEBUG", url);
                     return true;
                } else {
                	Log.d("DEBUG", url);
                	//view.loadUrl(url);
                	return super.shouldOverrideUrlLoading(view, url);
                }

            }

        });
    }
}

