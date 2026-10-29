package org.example.edushare.feature.document.entity;

import java.util.Locale;

public enum FileType {
    PDF,
    DOC,
    DOCX,
    PPT,
    PPTX,
    XLS,
    XLSX,
    TXT;

    public static FileType fromFileName(String fileName) {
        if (fileName == null) {
            throw new IllegalArgumentException("File name is required");
        }

        int extensionSeparator = fileName.lastIndexOf('.');
        if (extensionSeparator < 0 || extensionSeparator == fileName.length() - 1) {
            throw new IllegalArgumentException("File extension is required");
        }

        String extension = fileName.substring(extensionSeparator + 1).toUpperCase(Locale.ROOT);
        return FileType.valueOf(extension);
    }
}
