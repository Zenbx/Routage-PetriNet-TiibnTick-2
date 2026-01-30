package com.yowyob.petrinet.application;

import com.yowyob.petrinet.application.observability.NetObserver;
import com.yowyob.petrinet.domain.model.PetriNet;
import com.yowyob.petrinet.engine.PetriNetEngine;
import com.yowyob.petrinet.engine.StepResult;
import com.yowyob.petrinet.engine.state.NetState;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Application Service for executing a CTPN.
 * Holds the current State and the Model.
 * 
 * @author Thomas Djotio Ndié
 * @version V1.0
 * @since 30.09.25
 */
public class CTPNService {
    private final PetriNet net;
    private final PetriNetEngine engine;
    private NetState currentState;
    private final List<NetObserver> observers = new ArrayList<>();

    /**
     * Initializes the service with a model and engine.
     * Starts at time 0 with empty marking.
     */
    public CTPNService(PetriNet net) {
        this.net = Objects.requireNonNull(net);
        this.engine = new PetriNetEngine();
        this.currentState = new NetState();
    }

    /**
     * Registers an observer.
     */
    public void addObserver(NetObserver observer) {
        observers.add(observer);
    }

    /**
     * Sets the initial state.
     */
    public void setInitialState(NetState state) {
        this.currentState = state;
    }

    /**
     * Gets the current state.
     */
    public NetState getCurrentState() {
        return currentState;
    }

    /**
     * Advances the virtual time.
     * 
     * @param delta Amount of time tick to advance.
     */
    public void advanceTime(long delta) {
        if (delta < 0)
            throw new IllegalArgumentException("Delta must be >= 0");
        this.currentState = this.currentState.advanceTime(delta);
        notifyTimeAdvanced(this.currentState.getCurrentTime());
    }

    /**
     * Fires a transition.
     * 
     * @param transitionId Transition ID.
     * @param binding      Binding object.
     */
    public void fire(String transitionId, Object binding) {
        StepResult result = engine.fireTransition(net, currentState, transitionId, binding);
        this.currentState = result.newState();
        notifyTransitionFired(transitionId, binding, currentState.getCurrentTime(), result.consumedTokens(),
                result.producedTokens());
    }

    private void notifyTransitionFired(String tId, Object binding, long time,
            List<com.yowyob.petrinet.domain.model.color.Token<?>> consumed,
            List<com.yowyob.petrinet.domain.model.color.Token<?>> produced) {
        for (NetObserver obs : observers) {
            obs.onTransitionFired(tId, binding, time, consumed, produced);
        }
    }

    private void notifyTimeAdvanced(long time) {
        for (NetObserver obs : observers) {
            obs.onTimeAdvanced(time);
        }
    }

    public PetriNet getModel() {
        return net;
    }
}
