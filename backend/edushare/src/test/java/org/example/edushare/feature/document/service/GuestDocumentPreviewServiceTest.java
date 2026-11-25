package org.example.edushare.feature.document.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GuestDocumentPreviewServiceTest {
    private final GuestDocumentPreviewService service = new GuestDocumentPreviewService();

    @ParameterizedTest
    @ValueSource(ints = {1, 3})
    void returnsOnlyTheTopSixtyPercentOfTheFirstPageAsAnImage(int pages) throws Exception {
        byte[] png = service.render(pdf(pages));
        var image = ImageIO.read(new ByteArrayInputStream(png));
        assertThat(image).isNotNull();
        assertThat(image.getWidth()).isEqualTo(300);
        assertThat(image.getHeight()).isEqualTo(270);
        // The hidden lower part is blue, and later pages are green.
        for (int y = 0; y < image.getHeight(); y++) {
            for (int x = 0; x < image.getWidth(); x++) {
                assertThat(image.getRGB(x, y)).isEqualTo(Color.RED.getRGB());
            }
        }
    }

    @Test
    void failsWithoutReturningTheSourceWhenThePdfIsInvalidOrHasNoPages() throws Exception {
        assertThatThrownBy(() -> service.render(new byte[]{1, 2, 3})).isInstanceOf(IOException.class);
        assertThatThrownBy(() -> service.render(pdf(0))).isInstanceOf(IOException.class);
    }

    private byte[] pdf(int pages) throws IOException {
        try (var document = new PDDocument(); var output = new ByteArrayOutputStream()) {
            for (int index = 0; index < pages; index++) {
                var page = new PDPage(new PDRectangle(200, 300));
                document.addPage(page);
                try (var content = new PDPageContentStream(document, page)) {
                    content.setNonStrokingColor(index == 0 ? Color.BLUE : Color.GREEN);
                    content.addRect(0, 0, 200, 300);
                    content.fill();
                    if (index == 0) {
                        content.setNonStrokingColor(Color.RED);
                        content.addRect(0, 120, 200, 180);
                        content.fill();
                    }
                }
            }
            document.save(output);
            return output.toByteArray();
        }
    }
}
