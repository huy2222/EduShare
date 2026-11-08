package org.example.edushare.feature.document.controller;

import lombok.RequiredArgsConstructor;
import org.example.edushare.feature.document.service.VirusScanService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class VirusTestController {

    private final VirusScanService virusScanService;

    @PostMapping("/scan")
    public ResponseEntity<?> scan(
            @RequestParam("file") MultipartFile file
    ) throws IOException {

        boolean infected = virusScanService.isInfected(
                file.getInputStream()
        );

        return ResponseEntity.ok(
                infected ? "INFECTED" : "CLEAN"
        );
    }
}
