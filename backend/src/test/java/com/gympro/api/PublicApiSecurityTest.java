package com.gympro.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class PublicApiSecurityTest {

    @DynamicPropertySource
    static void itDatasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",
                () -> "jdbc:mysql://localhost:3307/gympro_it?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true");
        registry.add("spring.datasource.username", () -> "gympro");
        registry.add("spring.datasource.password", () -> "gympro");
    }

    @Autowired
    MockMvc mvc;

    @Autowired
    TestRestTemplate rest;

    @Test
    void healthIsPublic() throws Exception {
        mvc.perform(get("/api/health")).andExpect(status().isOk());
    }

    @Test
    void subscriptionPlansArePublic() throws Exception {
        mvc.perform(get("/api/subscription/plans")).andExpect(status().isOk());
    }

    @Test
    void validateKeyDoesNotRequireAuthenticationMockMvc() throws Exception {
        mvc.perform(post("/api/owner/validate-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"key\":\"bad\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void validateKeyDoesNotRequireAuthenticationTomcat() {
        ResponseEntity<String> r = rest.postForEntity("/api/owner/validate-key",
                Map.of("key", "bad"), String.class);
        assertEquals(HttpStatus.NOT_FOUND, r.getStatusCode());
    }

    @Test
    void healthTomcat() {
        ResponseEntity<String> r = rest.getForEntity("/api/health", String.class);
        assertEquals(HttpStatus.OK, r.getStatusCode());
        assertTrue(r.getBody() != null && r.getBody().contains("ok"));
    }
}
