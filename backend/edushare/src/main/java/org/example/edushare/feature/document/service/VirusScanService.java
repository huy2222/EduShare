package org.example.edushare.feature.document.service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.*;
import java.net.Socket;
import java.nio.charset.StandardCharsets;

@Service
public class VirusScanService {

    public enum ScanResult {
        CLEAN,
        INFECTED
    }

    @Value("${clamav.host}")
    private String host;
    @Value("${clamav.port}")
    private int port;
    @Value("${clamav.timeout}")
    private int timeout;

    public boolean isInfected(InputStream fileInput) throws IOException {
        return scan(fileInput) == ScanResult.INFECTED;
    }

    public ScanResult scan(InputStream fileInput) throws IOException {
        try (Socket socket = new Socket(host, port)) {
            socket.setSoTimeout(timeout);
            DataOutputStream output =
                    new DataOutputStream(socket.getOutputStream());
            InputStream response =
                    socket.getInputStream();
            // Gửi lệnh INSTREAM
            output.write("zINSTREAM\0".getBytes(StandardCharsets.US_ASCII));
            byte[] buffer = new byte[8192];
            int bytesRead;
            // Gửi file theo từng chunk
            while ((bytesRead = fileInput.read(buffer)) != -1) {
                output.writeInt(bytesRead);
                output.write(buffer, 0, bytesRead);
            }
            // Kết thúc stream bằng chunk có độ dài 0
            output.writeInt(0);
            output.flush();
            // Đọc kết quả từ ClamAV
            ByteArrayOutputStream result =
                    new ByteArrayOutputStream();
            int b;
            while ((b = response.read()) != -1 && b != 0) {
                result.write(b);
            }
            String scanResult = result.toString(StandardCharsets.UTF_8);
            if (scanResult.contains("FOUND")) {
                return ScanResult.INFECTED;
            }
            if (scanResult.contains("OK")) {
                return ScanResult.CLEAN;
            }
            throw new IOException(
                    "Unexpected ClamAV response: " + scanResult
            );
        }
    }
}

