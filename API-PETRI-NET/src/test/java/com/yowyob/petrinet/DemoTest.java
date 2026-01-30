package com.yowyob.petrinet;

import com.yowyob.petrinet.application.CTPNService;
import com.yowyob.petrinet.application.observability.NetObserver;
import com.yowyob.petrinet.domain.model.PetriNet;
import com.yowyob.petrinet.domain.model.color.Token;
import com.yowyob.petrinet.domain.model.structure.*;
import com.yowyob.petrinet.engine.state.NetState;

import java.util.Collections;
import java.util.List;
import java.util.Set;

public class DemoTest {
    public static void main(String[] args) {
        // 1. Create Places
        Place p1 = new Place("p1", "Start");
        Place p2 = new Place("p2", "End");

        // 2. Create Transition
        // Delay 10 units
        Transition t1 = new Transition("t1", "Move", 10, 100);

        // 3. Create Arcs
        // Arc P1 -> T1 (Consumes string)
        Arc arc1 = new Arc("p1", "t1", Arc.Type.INPUT, (binding) -> List.of(new Token<>((String) binding, 0))); // Mocking
                                                                                                                // creation
                                                                                                                // time
                                                                                                                // for
                                                                                                                // matching,
                                                                                                                // in
                                                                                                                // real
                                                                                                                // engine
                                                                                                                // matching
                                                                                                                // is by
                                                                                                                // value

        // Arc T1 -> P2 (Produces uppercase string)
        Arc arc2 = new Arc("p2", "t1", Arc.Type.OUTPUT,
                (binding) -> List.of(new Token<>(((String) binding).toUpperCase(), 0)));

        PetriNet net = new PetriNet(Set.of(p1, p2), Set.of(t1), Set.of(arc1, arc2));

        // 4. Setup Service
        CTPNService service = new CTPNService(net);

        // Add Observer
        service.addObserver(new NetObserver() {
            public void onTransitionFired(String tId, Object bind, long time, List<Token<?>> c, List<Token<?>> p) {
                System.out.println("[Event] Fired " + tId + " at " + time);
                System.out.println("   Consumed: " + c);
                System.out.println("   Produced: " + p);
            }

            public void onTimeAdvanced(long newTime) {
                System.out.println("[Time] Advanced to " + newTime);
            }
        });

        // 5. Initial State
        // Add token "hello" to P1 at time 0
        Token<String> token = Token.create("hello", 0);
        NetState startState = new NetState().withTokensAdded("p1", List.of(token));
        service.setInitialState(startState);

        System.out.println("Initial State: " + service.getCurrentState());

        // 6. Try to fire immediately (Should fail due to delay?)
        // Wait, delay is 10. Token created at 0.
        // Condition: current_time >= token_time + min_delay
        // 0 >= 0 + 10 ? False.
        try {
            System.out.println("Attempting fire at time 0...");
            service.fire("t1", "hello");
        } catch (IllegalArgumentException e) {
            System.out.println("Caught Expected Error: " + e.getMessage());
        }

        // 7. Advance time
        service.advanceTime(10);

        // 8. Fire
        System.out.println("Attempting fire at time 10...");
        service.fire("t1", "hello");

        System.out.println("Final State: " + service.getCurrentState());
    }
}
