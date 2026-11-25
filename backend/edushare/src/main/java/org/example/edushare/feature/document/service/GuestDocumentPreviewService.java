package org.example.edushare.feature.document.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class GuestDocumentPreviewService {
    private static final double VISIBLE_FRACTION = 0.6;
    private static final float MAX_WIDTH = 1200;
    private static final float MAX_HEIGHT = 1800;

    /** Only a rasterized excerpt leaves the server, including for single-page documents. */
    public byte[] render(byte[] pdf) throws IOException {
        try (var document = Loader.loadPDF(pdf)) {
            if (document.getNumberOfPages() == 0) {
                throw new IOException("PDF has no pages");
            }
            var page = document.getPage(0);
            var box = page.getCropBox();
            boolean rotated = page.getRotation() % 180 != 0;
            float width = rotated ? box.getHeight() : box.getWidth();
            float height = rotated ? box.getWidth() : box.getHeight();
            if (!Float.isFinite(width) || !Float.isFinite(height) || width <= 0 || height <= 0) {
                throw new IOException("Invalid PDF page size");
            }
            float scale = Math.min(1.5f, Math.min(MAX_WIDTH / width, MAX_HEIGHT / height));
            var renderer = new PDFRenderer(document);
            renderer.setSubsamplingAllowed(true);
            var image = renderer.renderImage(0, scale, ImageType.RGB);
            if (image.getHeight() < 2) {
                throw new IOException("PDF page is too small for a partial preview");
            }
            int visibleHeight = Math.max(1, (int) (image.getHeight() * VISIBLE_FRACTION));
            var excerpt = image.getSubimage(0, 0, image.getWidth(), visibleHeight);
            try (var output = new ByteArrayOutputStream()) {
                if (!ImageIO.write(excerpt, "png", output)) {
                    throw new IOException("PNG encoder unavailable");
                }
                return output.toByteArray();
            } finally {
                image.flush();
            }
        }
    }
}
