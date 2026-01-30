package com.yowyob.petrinet.domain.model.structure;

import com.yowyob.petrinet.domain.model.color.Token;
import java.util.List;

/**
 * Functional interface for arc expressions.
 * Maps a transition binding (color) to a multiset of tokens.
 * <p>
 * Corresponds to Pre(p, t)(c) and Post(p, t)(c).
 * 
 * @author Thomas Djotio Ndié
 * @version V1.0
 * @since 30.09.25
 */
@FunctionalInterface
public interface ArcExpression {
    /**
     * Evaluates the expression for a given binding.
     * 
     * @param transition_binding The color/object involved in the transition firing.
     * @return A list of Tokens (multiset) to be consumed or produced.
     */
    List<Token<?>> evaluate(Object transition_binding);
}
