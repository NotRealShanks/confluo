package com.github.notrealshanks.confluobackend.service;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.InputStream;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.gridfs.GridFsOperations;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.model.Project;
import com.github.notrealshanks.confluobackend.model.Role;

@ExtendWith(MockitoExtension.class)
class AssetServiceTests {
    @Mock private ProjectService projectService;
    @Mock private GridFsTemplate gridFsTemplate;
    @Mock private GridFsOperations gridFsOperations;
    @InjectMocks private AssetService assetService;

    @Test
    void storesTheOriginalPdfBytesWithPdfContentType() throws Exception {
        byte[] original = new byte[] { '%', 'P', 'D', 'F', '-', '1', '.', '7', 0, (byte) 0xff };
        when(projectService.requireAccess("editor", "project"))
                .thenReturn(new ProjectService.Access(new Project(), Role.EDITOR));
        ObjectId id = new ObjectId();
        when(gridFsTemplate.store(any(InputStream.class), anyString(), anyString(), any(Document.class))).thenReturn(id);

        var response = assetService.upload("editor", "project", new MockMultipartFile("file", "scan.bin", "text/plain", original));

        assertEquals(id.toHexString(), response.assetId());
        assertEquals("application/pdf", response.contentType());
        ArgumentCaptor<InputStream> bytes = ArgumentCaptor.forClass(InputStream.class);
        verify(gridFsTemplate).store(bytes.capture(), anyString(), anyString(), any(Document.class));
        assertArrayEquals(original, bytes.getValue().readAllBytes());
    }

    @Test
    void rejectsFilesThatOnlyClaimToBePdf() {
        when(projectService.requireAccess("editor", "project"))
                .thenReturn(new ProjectService.Access(new Project(), Role.EDITOR));
        var fakePdf = new MockMultipartFile("file", "fake.pdf", "application/pdf", "plain text".getBytes());

        var error = assertThrows(ResponseStatusException.class, () -> assetService.upload("editor", "project", fakePdf));

        assertEquals(HttpStatus.UNSUPPORTED_MEDIA_TYPE, error.getStatusCode());
        verify(gridFsTemplate, never()).store(any(InputStream.class), anyString(), anyString(), any(Document.class));
    }

    @Test
    void rejectsViewerUploads() {
        when(projectService.requireAccess("viewer", "project"))
                .thenReturn(new ProjectService.Access(new Project(), Role.VIEWER));

        var error = assertThrows(ResponseStatusException.class, () -> assetService.upload("viewer", "project",
                new MockMultipartFile("file", "file.pdf", "application/pdf", "%PDF-1.7".getBytes())));

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verify(gridFsTemplate, never()).store(any(InputStream.class), anyString(), anyString(), any(Document.class));
    }
}
