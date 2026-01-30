package com.yowyob.petrinet.api;

import com.yowyob.petrinet.api.dto.ArcDTO;
import com.yowyob.petrinet.api.dto.NetDTO;
import com.yowyob.petrinet.api.dto.TokenDTO;
import com.yowyob.petrinet.api.dto.TransitionDTO;
import com.yowyob.petrinet.service.PetriNetService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;

@WebFluxTest(PetriNetController.class)
class PetriNetControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    private PetriNetService petriNetService;

    @Test
    void createNet_ShouldReturnId() {
        NetDTO netDto = new NetDTO();
        netDto.name = "Test Net";
        netDto.places = List.of("p1");
        netDto.transitions = List.of(new TransitionDTO("t1", "T1", 0, 10));
        netDto.arcs = List.of(new ArcDTO("p1", "t1", "INPUT", 1));

        Mockito.when(petriNetService.createNet(any(NetDTO.class))).thenReturn(Mono.just("net-123"));

        webTestClient.post()
                .uri("/api/nets")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(netDto)
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class).isEqualTo("net-123");
    }

    @Test
    void fireTransition_ShouldReturnOk() {
        Map<String, List<TokenDTO>> binding = Map.of("p1", List.of(new TokenDTO("A", 0)));

        Mockito.when(petriNetService.fireTransition(any(String.class), any(String.class), any(Map.class)))
                .thenReturn(Mono.empty());

        webTestClient.post()
                .uri("/api/nets/net-123/fire/t1")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(binding)
                .exchange()
                .expectStatus().isOk();
    }
}
