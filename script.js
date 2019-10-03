package com.mersoft.labconco.webserver;

import android.content.Context;
import android.util.Log;

import com.mersoft.labconco.framework.FreezeZone;
import com.mersoft.labconco.R;
import com.mersoft.labconco.webserver.utility.Utility;

import org.apache.commons.io.comparator.LastModifiedFileComparator;
import org.apache.http.HttpEntity;
import org.apache.http.HttpException;
import org.apache.http.HttpRequest;
import org.apache.http.HttpResponse;
import org.apache.http.entity.ContentProducer;
import org.apache.http.entity.EntityTemplate;
import org.apache.http.entity.FileEntity;
import org.apache.http.entity.StringEntity;
import org.apache.http.protocol.HttpContext;
import org.apache.http.protocol.HttpRequestHandler;

import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.UnsupportedEncodingException;
import java.net.URLConnection;
import java.text.DateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;

public class HomeCommandHandler implements HttpRequestHandler {
    final static String TAG = "HomeCommandHandler";
    private static final String EXTERNAL_STORAGE_PATH = FreezeZone.getFilePath();
    private Context context = null;
    int serverPort = 0;

    public HomeCommandHandler(Context context, int serverPort) {
        this.context = context;
        this.serverPort = serverPort;
    }

    @Override
    public void handle(HttpRequest request, HttpResponse response, HttpContext httpContext) throws HttpException, IOException {
        HttpEntity entity = null;
        String uriString = request.getRequestLine()
                .getUri();

        if (uriString.equalsIgnoreCase("/")) {
            entity = getEntityFromUri(uriString, response);

        } else if (uriString.equalsIgnoreCase("favicon.ico")) {
            entity = new EntityTemplate(new ContentProducer() {
                public void writeTo(final OutputStream outstream) throws IOException {
                    OutputStreamWriter writer = new OutputStreamWriter(outstream, "UTF-8");
                    String resp = Utility.openHTMLString(context, R.raw.nodirlisting);

                    writer.write(resp);
                    writer.flush();
                }
            });
            response.setHeader("Context-Type", "text/html");
        } else {
            entity = new EntityTemplate(new ContentProducer() {
                public void writeTo(final OutputStream outstream) throws IOException {
                    OutputStreamWriter writer = new OutputStreamWriter(outstream, "UTF-8");
                    String resp = Utility.openHTMLString(context, R.raw.nodirlisting);

                    writer.write(resp);
                    writer.flush();
                }
            });

            response.setHeader("Context-Type", "text/html");
        }

        response.setEntity(entity);
    }

    private HttpEntity getEntityFromUri(String uri, HttpResponse response) {
        String contentType = "text/html";
        String filepath = FreezeZone.getFilePath();

        final File file = new File(filepath);

        HttpEntity entity = null;

        if (file.isDirectory()) {
            entity = new EntityTemplate(new ContentProducer() {
                public void writeTo(final OutputStream outstream) throws IOException {
                    OutputStreamWriter writer = new OutputStreamWriter(outstream, "UTF-8");
                    String resp = getDirListingHTML(file);

                    writer.write(resp);
                    writer.flush();
                }
            });

            ((EntityTemplate) entity).setContentType(contentType);
        } else if (file.exists()) {
            contentType = URLConnection.guessContentTypeFromName(file.getAbsolutePath());

            entity = new FileEntity(file, contentType);

            response.setHeader("Content-Type", contentType);
        } else {
            try {
                entity = new StringEntity(Utility.openHTMLString(context, R.raw.notfound));
                response.setHeader("Content-Type", "text/html");
            } catch (UnsupportedEncodingException e) {
                Log.e(TAG, "Error encoding header", e);
            }
        }

        Log.v("WEB-Folder", "Content Type: " + contentType);

        return entity;
    }

    private String getDirListingHTML(File file) {
        ArrayList<String> fileList = getDirListing(file);
        String htmltemplate = Utility.openHTMLString(context, R.raw.home);
        String html = "";
        String fileinfo[] = null;
        if (fileList.size() > 0) {
            for (String fileName : fileList) {
                fileinfo = fileName.split("@");

                html += "<div class=\"col-md-4 col-sm-6\">";
                html += "<a href=\"/dir/" + fileinfo[0] + "\"> <h4 style=\"color:#333333\"><span class=\"glyphicon glyphicon-file\">" + fileinfo[0] + "</h4></a>";
                html += "</div>";
            }
        } else {
            html += "<div class=\"col-md-4 col-sm-6\">";
            html += "<h4> No Files Found</h4>";
            html += "</div>";
        }

        html = htmltemplate.replace("%FOLDERLIST%", html);

        String upgradeoptionhtml = "";
        upgradeoptionhtml += "<div class=\"btn-group\" data-toggle =\"buttons\" >";
        upgradeoptionhtml += "  <label class=\"btn btn-primary active\" >";
        upgradeoptionhtml += "     <input type =\"radio\" name =\"isFreezeDryer\" value=\"optionFD\" autocomplete =\"off\" checked > FreezeDryer</input>";
        upgradeoptionhtml += "  </label >";
        upgradeoptionhtml += "  <label class=\"btn btn-primary\" >";
        upgradeoptionhtml += "     <input type =\"radio\" name =\"isFreezeDryer\" value=\"optionACC\" autocomplete =\"off\">Accessory</input>";
        upgradeoptionhtml += "  </label >";
        upgradeoptionhtml += "</div>";
        html = html.replace("%ITEMSELECT%", upgradeoptionhtml);

        return html;
    }

    private ArrayList<String> getDirListing(File file) {
        if (file == null || !file.isDirectory()) return null;
        File[] files = file.listFiles();
        ArrayList<File> fileArrayList = new ArrayList<File>();
        ArrayList<String> fileList = new ArrayList<String>();
        if (files != null) {
            Collections.addAll(fileArrayList, files);

            Collections.sort(fileArrayList, LastModifiedFileComparator.LASTMODIFIED_REVERSE);

            DateFormat dateformat = DateFormat.getDateInstance();

            for (File f : fileArrayList) {
                fileList.add(f.getAbsolutePath()
                        .substring(EXTERNAL_STORAGE_PATH.length() + 1) + "@" + dateformat.format(new Date(f.lastModified())));
            }
        }

        return fileList;
    }
}
