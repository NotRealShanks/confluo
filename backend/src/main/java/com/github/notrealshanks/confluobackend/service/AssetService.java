package com.github.notrealshanks.confluobackend.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.gridfs.GridFsOperations;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.AssetResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AssetService {
    private final ProjectService projectService;
    private final GridFsTemplate gridFsTemplate;
    private final GridFsOperations gridFsOperations;

    public AssetResponse upload(String userId, String projectId, MultipartFile file) {
        requireWriteAccess(userId, projectId);
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Asset is empty");
        }
        if (!isPdf(file)) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Only PDF assets are supported");
        }
        try (InputStream input = file.getInputStream()) {
            Document metadata = new Document("projectId", projectId)
                    .append("contentType", MediaType.APPLICATION_PDF_VALUE);
            ObjectId id = gridFsTemplate.store(input, file.getOriginalFilename(), MediaType.APPLICATION_PDF_VALUE, metadata);
            return new AssetResponse(id.toHexString(), MediaType.APPLICATION_PDF_VALUE, file.getSize());
        } catch (IOException error) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read asset", error);
        }

    }

    private static boolean isPdf(MultipartFile file) {
        try (InputStream input = file.getInputStream()) {
            byte[] header = input.readNBytes(1024);
            byte[] signature = "%PDF-".getBytes(java.nio.charset.StandardCharsets.US_ASCII);
            for (int i = 0; i <= header.length - signature.length; i++) {
                if (Arrays.equals(Arrays.copyOfRange(header, i, i + signature.length), signature)) return true;
            }
            return false;
        } catch (IOException error) {
            return false;
        }
    }

    public AssetDownload download(String userId, String projectId, String assetId) {
        projectService.requireAccess(userId, projectId);
        ObjectId id = parseId(assetId);
        var file = gridFsOperations.findOne(Query.query(Criteria.where("_id").is(id)
                .and("metadata.projectId").is(projectId)));
        if (file == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Asset not found");
        try {
            return new AssetDownload(
                    gridFsOperations.getResource(file).getInputStream(),
                    file.getLength(),
                    file.getMetadata() == null ? "application/octet-stream"
                            : file.getMetadata().getString("contentType"));
        } catch (IOException error) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not read asset", error);
        }
    }

    public void delete(String userId, String projectId, String assetId) {
        requireWriteAccess(userId, projectId);
        ObjectId id = parseId(assetId);
        var file = gridFsOperations.findOne(Query.query(Criteria.where("_id").is(id)
                .and("metadata.projectId").is(projectId)));
        if (file == null) return;
        gridFsTemplate.delete(Query.query(Criteria.where("_id").is(id)));
    }

    private void requireWriteAccess(String userId, String projectId) {
        if (!projectService.requireAccess(userId, projectId).role().canEdit()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Project is read-only");
        }
    }

    private static ObjectId parseId(String assetId) {
        if (!ObjectId.isValid(assetId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Asset not found");
        }
        return new ObjectId(assetId);
    }

    public record AssetDownload(InputStream stream, long length, String contentType) {
    }
}
