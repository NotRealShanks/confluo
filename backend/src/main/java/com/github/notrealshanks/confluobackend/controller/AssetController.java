package com.github.notrealshanks.confluobackend.controller;

import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.github.notrealshanks.confluobackend.dto.AssetResponse;
import com.github.notrealshanks.confluobackend.service.AssetService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/projects/{projectId}/assets")
@RequiredArgsConstructor
public class AssetController {
    private final AssetService assetService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AssetResponse upload(
            Authentication authentication,
            @PathVariable String projectId,
            @RequestPart("file") MultipartFile file) {
        return assetService.upload(authentication.getName(), projectId, file);
    }

    @GetMapping("/{assetId}")
    public ResponseEntity<InputStreamResource> download(
            Authentication authentication,
            @PathVariable String projectId,
            @PathVariable String assetId) {
        var asset = assetService.download(authentication.getName(), projectId, assetId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(asset.contentType()))
                .contentLength(asset.length())
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().build().toString())
                .body(new InputStreamResource(asset.stream()));
    }

    @DeleteMapping("/{assetId}")
    public void delete(
            Authentication authentication,
            @PathVariable String projectId,
            @PathVariable String assetId) {
        assetService.delete(authentication.getName(), projectId, assetId);
    }
}
