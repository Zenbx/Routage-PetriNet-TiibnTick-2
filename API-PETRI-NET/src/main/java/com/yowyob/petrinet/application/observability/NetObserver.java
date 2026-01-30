package com.yowyob.petrinet.application.observability;

import com.yowyob.petrinet.domain.model.color.Token;
import java.util.List;

/**
 * Observer interface for CTPN execution events.
 * 
 * @author Thomas Djotio Ndié
 * @version V1.0
 * @since 30.09.25
 */
public interface NetObserver {
    /**
     * Called when a transition is successfully fired.
     * 
     * @param transitionId  The ID of the fired transition.
     * @param binding       The binding used.
     * @param executionTime The virtual time of execution.
     * @param consumed      Tokens consumed.
     * @param produced      Tokens produced.
     */
    void onTransitionFired(String transitionId, Object binding, long executionTime, List<Token<?>> consumed,
            List<Token<?>> produced);

    /**
     * Called when time advances.
     * 
     * @param newTime The new virtual time.
     */
    void onTimeAdvanced(long newTime);
}
