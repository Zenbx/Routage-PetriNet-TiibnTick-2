package com.yowyob.petrinet.engine;

import com.yowyob.petrinet.domain.model.PetriNet;
import com.yowyob.petrinet.domain.model.color.Token;
import com.yowyob.petrinet.domain.model.structure.Arc;
import com.yowyob.petrinet.domain.model.structure.ArcExpression;
import com.yowyob.petrinet.domain.model.structure.Place;
import com.yowyob.petrinet.domain.model.structure.Transition;
import com.yowyob.petrinet.engine.state.NetState;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class PetriNetEngineTest {

    @Test
    void shouldFireTransitionAndProduceTokens() {
        // Setup
        Place p1 = new Place("p1", "Place 1");
        Place p2 = new Place("p2", "Place 2");
        Transition t1 = new Transition("t1", "Transition 1", 0, 100);

        // Expression: Value -> List<Token>
        ArcExpression exprIn = binding -> List.of(new Token<>("A", 0));
        ArcExpression exprOut = binding -> List.of(new Token<>("B", 0));

        Arc a1 = new Arc("p1", "t1", Arc.Type.INPUT, exprIn);
        Arc a2 = new Arc("p2", "t1", Arc.Type.OUTPUT, exprOut);

        PetriNet net = new PetriNet(Set.of(p1, p2), Set.of(t1), Set.of(a1, a2));
        PetriNetEngine engine = new PetriNetEngine();

        // Initial State: p1 has Token("A")
        NetState initialState = new NetState(
                Map.of("p1", List.of(new Token<>("A", 0))),
                0);

        // Act
        StepResult result = engine.fireTransition(net, initialState, "t1", "binding");

        // Assert
        NetState newState = result.newState();
        // p1 consumed
        assertTrue(newState.getTokens("p1").isEmpty());
        // p2 produced
        List<Token<?>> p2Tokens = newState.getTokens("p2");
        assertEquals(1, p2Tokens.size());
        assertEquals("B", p2Tokens.get(0).value());
    }

    @Test
    void shouldThrowExceptionIfTokenMissing() {
        // Setup
        Place p1 = new Place("p1", "Place 1");
        Transition t1 = new Transition("t1", "Transition 1", 0, 100);
        ArcExpression exprIn = binding -> List.of(new Token<>("A", 0));
        Arc a1 = new Arc("p1", "t1", Arc.Type.INPUT, exprIn);

        PetriNet net = new PetriNet(Set.of(p1), Set.of(t1), Set.of(a1));
        PetriNetEngine engine = new PetriNetEngine();
        NetState initialState = new NetState(); // Empty

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> engine.fireTransition(net, initialState, "t1", "binding"));
    }
}
